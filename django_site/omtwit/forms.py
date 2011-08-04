
from django.forms import ModelForm
from omtwit.models import Twit

class TwitForm(ModelForm):
    class Meta:
        model = Twit

