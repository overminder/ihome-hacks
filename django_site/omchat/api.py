
from tastypie.api import Api
from tastypie.resources import ModelResource
from tastypie import fields
from tastypie.authorization import Authorization
from tastypie.validation import Validation
from omchat.models import Chat

class FieldValidationError(Exception):
    """name, reason"""
    def update_to(self, errors):
        if not errors.get(self.args[0]):
            errors[self.args[0]] = []
        errors[self.args[0]].append(self.args[1])

api = Api(api_name='v1')

def dump_rc(rc_class, obj_or_list):
    """serialize the given object/object_list using the resource
    class provided.  returns a json-encoded string"""

    from django.db.models.query import QuerySet
    rc = rc_class()

    get_data = lambda bundle: rc.full_dehydrate(bundle).data
    build_bundle = lambda obj: rc.build_bundle(obj=obj, request=None)

    if isinstance(obj_or_list, QuerySet):
        bundles = (build_bundle(obj) for obj in obj_or_list)
        res = {
            'objects': [get_data(bundle) for bundle in bundles]
        }
    else:
        bundle = build_bundle(obj_or_list)
        res = get_data(bundle)

    res = rc.serialize(None, res, 'application/json')
    # copied from google plus~
    return res.replace('<', '\u003c').replace('>', '\u003e')


class ChatRc(ModelResource):
    #: can specify it, but cannot change it.
    is_reply_to = fields.ToOneField('self', 'is_reply_to', null=True,
            full=True)

    #: passive attr, read only
    replies = fields.ToManyField('self', 'replies', null=True, readonly=True)

    class Meta:
        queryset = Chat.objects.all()
        resource_name = 'chat'

        class ChatRcAuth(Authorization):
            def is_authorized(self, request, obj=None):
                method = request.method
                if method in ('GET', 'POST'):
                    return True
                else:
                    return False

        class ChatRcValidation(Validation):
            def ensure_length(self, bundle, name, min_length, max_length):
                if min_length <= len(bundle.data.get(name, '')) <= max_length:
                    return
                else:
                    raise FieldValidationError(name,
                            'length should be between %d - %d' % (
                                min_length, max_length))

            def is_valid(self, bundle, request=None):
                if not bundle.data:
                    return {'__all__': 'should not be null'}

                errors = {}
                if not bundle.data.get('author'):
                    bundle.data['author'] = request.META['REMOTE_ADDR']

                for name, max_length in (('author', 63), ('content', 255)):
                    try:
                        self.ensure_length(bundle, name, 1, max_length)
                    except FieldValidationError as e:
                        e.update_to(errors)
                return errors

        authorization = ChatRcAuth()
        validation = ChatRcValidation()
        list_allowed_method = ['get', 'post']
        detail_allowed_method = ['get']


api.register(ChatRc())

# so we can include
urlpatterns = api.urls

