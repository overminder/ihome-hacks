#!/usr/bin/env python

import os
import json
from collections import defaultdict
from cStringIO import StringIO

tmpldict = {}

def make_template(filename, content):
    return '%s: _.template(%s)' % (filename, content)

def get_walker():
    return os.walk('.')

def is_template_file(filename):
    return filename.endswith('.erb')

def get_content(dirpath, filename):
    res = []
    for line in open(os.path.join(dirpath, filename)):
        res.append(line.strip())
    return json.dumps(' '.join(res))

def pack_to_dict(dirpath, filename, d):
    prefix = dirpath[2:]
    d[prefix].append((
        filename[:-4],
        get_content(dirpath, filename)
    ))

def dict_to_js(d):
    jscontent = StringIO()
    emit = jscontent.write
    emit('(function() {\n')

    root_name = '__root_module'
    emit('var %s = {};\n' % root_name)

    for prefix, file_list in d.iteritems():
        emit('(function() {\n')
        module_name = '__curr_module'
        emit('var %s = {};\n' % module_name)
        emit('%s.%s = %s;\n' % (root_name, prefix, module_name))

        for name, content in file_list:
            emit('%s.%s = _.template(%s);\n' % (module_name, name, content))
        emit('})();\n')

    emit('return %s;' % root_name)

    emit('})();\n')
    return jscontent.getvalue()

def main():
    d = defaultdict(lambda: [])
    root_path = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root_path)

    for dirpath, dirname, filenames in get_walker():
        if dirpath == './':
            continue
        for filename in filenames:
            if is_template_file(filename):
                pack_to_dict(dirpath, filename, d)

    js_template = ('define(["underscore-template-autoescape"], function() {\n'
                   'return %s;\n'
                   '});\n')

    make_target = '../tmpl-packed.js'

    with open(make_target, 'w') as f:
        f.write(js_template % dict_to_js(d))

if __name__ == '__main__':
    main()

