import os
import re
import json
import collections


def get_content(file):
  with open(file, 'r', encoding='UTF-8') as f:
    return f.read()


def write_content(file, content):
  with open(file, 'w', encoding='UTF-8') as f2:
    f2.write(content)


def content_files():
  file_paths = []
  for root, dirs, files in os.walk(os.path.abspath("./src")):
    for name in files:
      print(name, dirs)
      if re.match('.+\.(js|vue)', name) and name != 'node_module':
        file_paths.append(os.path.join(root, name))
  return file_paths


def get_t(items, dd, content, path):
  for item in items:
    print(item[0], path)
    dd[item[0]] = item[0]


def getdd():
  dd = collections.OrderedDict()

  return dd


def parse():
  dd = getdd()

  for path in content_files():
    s1 = get_content(path)
    get_t(re.findall(re.compile('\$t\(\s*[\'"](.+)[\'"](,\s*\{.+\})?\s*\)'), s1), dd, s1, path)
    get_t(re.findall(re.compile('i18n\.t\(\s*[\'"](.+)[\'"](,\s*\{.+\})?\s*\)'), s1), dd, s1, path)

  _list = []
  for item in dd:
    te = {}
    te['key'] = item
    te['zh'] = item
    te['en'] = item
    _list.append(te)
  write_content("zh-cn.json",
                json.dumps(_list, ensure_ascii=False, sort_keys=False, indent=4, separators=(',', ':')))


if __name__ == '__main__':
  parse()
