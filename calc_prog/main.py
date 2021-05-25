import json
import numpy as np
import GGA


# Плотность воды, кг/м3
p_water = 997

# Ускорение своодного падения, м/с2
g = 9.80665


# Табличные значения удельных сопротивлений участков
s0 = {
    "cost_iron": {
        "100": 311.7,
        "125": 96.72,
        "150": 37.11,
        "200": 8.092
    },
    "steel": {
        "100": 172.9,
        "125": 76.36,
        "150": 30.65,
        "200": 6.959
    }
}


# Функция нахождения индекса строки или столбца с указанным
#   @mode - режим поиска (True = "по строкам", False = "по столбцам")
def get_index(mtx, id, mode):
    # Поиск по строкам
    if mode:
        for i in range(1, len(mtx)):
            if id == mtx[i][0]:
                return i
    # Поиск по столбцам
    else:
        for j in range(1, len(mtx[0])):
            if id == mtx[0][j]:
                return j
    return -1


vertices = {}
edges = {}


# Чтение исходных данных
input = open('./calc/input.json', 'r')
data = json.load(input)
input.close()


# Размерность матрицы инцидентности
N = len(data['objects']) + 1
M = len(data['pipes']) + 1
matrix = [[0 for j in range(M)] for i in range(N)]


# Заполнение информации об индентификаторах объектов и соединений
for i in range(1, N):
    matrix[i][0] = data['objects'][i-1]['id']

for j in range(1, M):
    matrix[0][j] = data['pipes'][j-1]['id']


# Заполнение матрицы инцидентности
for pipe in data['pipes']:
    for obj in data['objects']:
        if obj['point'] == pipe['point_beg']:
            matrix[get_index(matrix, obj['id'], True)][get_index(matrix, pipe['id'], False)] = 1
        elif obj['point'] == pipe['point_end']:
            matrix[get_index(matrix, obj['id'], True)][get_index(matrix, pipe['id'], False)] = -1

# for i in range(len(matrix)):
#     for j in range(len(matrix[0])):
#         print(matrix[i][j], end='\t')
#     print()

# id узлов и участков сети
vertices_id = np.array(matrix)[1:, 0]
edges_id = np.array(matrix)[0, 1:]

# Данные по расходам и давлениям на узлах
costs = {}
pressures = {}

# Гидравлические сопротивления участков
resists = {}

for p in data['params']:
    if p['id'] in vertices_id and 'q' in p and p['q'] != '':
        costs[p['id']] = -float(p['q'])
    elif p['id'] in vertices_id and 'h' in p and p['h'] != '':
        pressures[p['id']] = float(p['h']) * p_water * g
    elif p['id'] in edges_id:
        # Произведение соответствующего s0, длины участка и поправочного коэф.
        resists[p['id']] = s0[p['material']][p['diameter']] * float(p['length']) * 0.852 * pow(1 + 0.867 / float(p['velocity']), 0.3)


# Нахождение решения
P, q = GGA.solve(matrix, costs, pressures, resists)


# Расход на источнике
source_id = next(obj['id'] for obj in data['objects'] if obj['type'] == 'source')
source_param_indx = next(i for i in range(len(data['params'])) if data['params'][i]['id'] == source_id)
data['params'][source_param_indx]['q'] = - np.round(sum(list(costs.values())), 4)


# Вывод результатов
for param in data['params']:
    if param['id'] in edges_id:
        param['q'] = np.round(q[param['id']], 4)
    elif param['id'] in vertices_id:
        param['h'] = np.round(P[param['id']] / (p_water * g), 4)

output = open('./calc/output.json', 'w')
json.dump(data, output)
output.close()
