import os
import sys
import glob
sys.path.insert(0, '/home/overmind/src/py/rpcsync/')
import sync

here = os.path.dirname(os.path.abspath(__file__))
remote = '/home/ch_jyx/src/django_site'
remote_static_path = '/home/ch_jyx/static'

def main():

    all_uploads = []
    add_upload = all_uploads.append

    # for the site
    add_upload(sync.filter_by_matcher(
            #glob.glob('*.py'),
            ['settings.py', 'urls.py', 'secret_key.py'],
            lambda *argl: True,
            lambda filename: (os.path.join(here, filename),
                              os.path.join(remote, filename))))

    # for the app
    if len(sys.argv) == 2:
        app_name = sys.argv[1]
        if app_name == 'syncdb': # upload the current db
            add_upload(sync.filter_by_matcher(
                    ['db.sqlite3'],
                    lambda *argl: True,
                    lambda filename: (os.path.join(here, filename),
                                      os.path.join(remote, filename))))
        else:
            if app_name.endswith('/'):
                app_name = app_name[:-1]
            local_app_path = os.path.join(here, app_name)
            remote_app_path = os.path.join(remote, app_name)
            add_upload(sync.filter_by_matcher(sync.walk_files(local_app_path),
                    lambda (prefix, filename):
                        (sync.file_filter('py')((prefix, filename)) and
                         not prefix.startswith( # dont sync app/static
                             os.path.join(local_app_path, 'static'))),
                    sync.path_appender(remote_app_path, local_app_path)))

            local_tmpl_path = os.path.join(local_app_path, 'templates')
            remote_tmpl_path = os.path.join(remote_app_path, 'templates')
            add_upload(sync.filter_by_matcher(
                    sync.walk_files(local_tmpl_path),
                    sync.file_filter('html'),
                    sync.path_appender(remote_tmpl_path, local_tmpl_path)))

    # for the static
    local_static_path = os.path.join(here, 'static')
    add_upload(sync.filter_by_matcher(
            sync.walk_files(local_static_path),
            lambda (prefix, filename): not prefix.startswith(
                os.path.join(here, 'static', 'admin')), # no admin.
            sync.path_appender(remote_static_path, local_static_path)))

    # for site templates
    site_tmpl_path = os.path.join(here, 'templates')
    remote_tmpl_path = os.path.join(remote, 'templates')
    add_upload(sync.filter_by_matcher(
            sync.walk_files(site_tmpl_path),
            sync.file_filter('html'),
            sync.path_appender(remote_tmpl_path, site_tmpl_path)))

    sync.sync_by_time(*all_uploads)


if __name__ == '__main__':
    main()

