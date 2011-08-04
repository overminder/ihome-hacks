
from django.contrib.contenttypes.models import ContentType
from tastypie.api import Api
from tastypie.resources import ModelResource
from tastypie import fields
from tastypie.authorization import Authorization
from tastypie.validation import Validation
from omtwit.models import Twit, OmUser, InfoStream

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

    return rc.serialize(None, res, 'application/json')


class ContentTypeRc(ModelResource):
    class Meta:
        queryset = ContentType.objects.all()
        resource_name = 'contenttypes'
        fields = ['model']
        allowed_methods = ['get']


class OmUserRc(ModelResource):
    following = fields.ToManyField('self', 'following')
    followers = fields.ToManyField('self', 'followers')
    class Meta:
        queryset = OmUser.objects.all()
        resource_name = 'omuser'


class InfoStreamRc(ModelResource):
    content_type = fields.ToOneField(ContentTypeRc, 'content_type')
    class Meta:
        queryset = InfoStream.objects.all()
        resource_name = 'infostream'


class TwitRc(ModelResource):
    author = fields.ToOneField(OmUserRc, 'author') # err if doesn't exist
    #: content, will not complain if too long. this must be implemented using
    # validation class

    #: can specify it, but cannot change it.
    is_reply_to = fields.ToOneField('self', 'is_reply_to', null=True)

    #: passive attr, read only
    replies = fields.ToManyField('self', 'replies', null=True, readonly=True)
    class Meta:
        queryset = Twit.objects.all()
        resource_name = 'twit'

        class TwitRcAuth(Authorization):
            def is_authorized(self, request, obj=None):
                method = request.method
                if method == 'GET':
                    return True
                elif method in ('POST', 'DELETE', 'PUT'):
                    #print 'method=%s, obj=%s' % (method, obj)
                    return request.user.is_authenticated()

            def apply_limits(self, request, obj_list):
                if not request: # we come here through rel
                    #print 'apply limit -- no req'
                    return obj_list.all()
                method = request.method # will never be POST.
                if method in ('GET'):
                    #print 'apply limit -- %s, pass' % method
                    return obj_list.all()
                if method in ('DELETE', 'PUT'):
                    #print 'apply limit -- %s, filter' % method
                    if request.user.is_authenticated():
                        return obj_list.filter(author__base=request.user)
                    else:
                        return obj_list.none()

        class TwitRcValidation(Validation):
            def is_valid(self, bundle, request=None):
                if not bundle.data:
                    return {'__all__': 'should not be null'}

                errors = {}
                if not bundle.data.get('content'):
                    errors['content'] = ['should not be null']
                elif len(bundle.data['content']) > 255:
                    errors['content'] = ['too long']
                return errors

        authorization = TwitRcAuth()
        validation = TwitRcValidation()
        list_allowed_method = ['get', 'post']
        detail_allowed_method = ['get', 'put', 'delete']


api.register(ContentTypeRc())
api.register(OmUserRc())
api.register(TwitRc())
api.register(InfoStreamRc())

# so we can include
urlpatterns = api.urls

