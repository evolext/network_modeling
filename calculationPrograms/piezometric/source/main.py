import json
from collections import defaultdict


# Находит все пути в графе от вершины s до вершины d
def find_all_paths(u, d, visited, path):
    # Помечаем текущую вершину как посещенную и добавляем в путь
    visited[u] = True
    path.append(u)

    # Если текущая вершина совпадает с конечной, то выводим путь
    if u == d:
        found_paths.append(path.copy())
    # Иначе проходимся по каждой смежной с текущей вершиной
    else:
        for adj in graph[u]:
            if not visited[adj]:
                find_all_paths(adj, d, visited, path)

    # Удаляем текущую вершину из пути и отмечаем как непройденную
    path.pop()
    visited[u] = False


# Чтение исходных данных
input = open('./calc/input.json', 'r')
data = json.load(input)
input.close()


# Списки смежностей графа сети
graph = defaultdict(list)

# Заполнение информации о графе
for pipe in data['pipes']:
    key = next(obj['id'] for obj in data['objects'] if obj['point'] == pipe['point_beg'])
    adj = next(obj['id'] for obj in data['objects'] if obj['point'] == pipe['point_end'])

    graph[key].append(adj)


# Все вершины отмечаем как непосещенные
visited = defaultdict(bool)
for obj in data['objects']:
    visited[obj['id']] = False


# Начальная и конечная вершины
s = int(data['route']['start'])
d = int(data['route']['end'])

# Все пути от вершины s до вершины d
found_paths = []

if s not in visited.keys():
    raise KeyError('Указан неверный идентификатор начальной вершины')
elif d not in visited.keys():
    raise KeyError('Указан неверный идентификатор конечной вершины')
else:
    find_all_paths(s, d, visited, [])

    # Запись ответа
    result = {
        'paths': []
    }

    if found_paths:

        for path_by_vertices in found_paths:
            full_path = []
            for i in range(len(path_by_vertices) - 1):
                key_beg = path_by_vertices[i]
                key_end = path_by_vertices[i + 1]

                point_beg = next(obj['point'] for obj in data['objects'] if obj['id'] == key_beg)
                point_end = next(obj['point'] for obj in data['objects'] if obj['id'] == key_end)

                key_edge = next(pipe['id'] for pipe in data['pipes']
                                if pipe['point_beg'] == point_beg and pipe['point_end'] == point_end)

                full_path.append(key_beg)
                full_path.append(key_edge)

            full_path.append(int(data['route']['end']))
            result['paths'].append(full_path)

    output = open('./calc/output.json', 'w')
    json.dump(result, output)
    output.close()















