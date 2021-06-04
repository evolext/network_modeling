import json
import numpy as np
import GGA
from scipy.special import gamma as gamma_func


# Число знаков после запятой в результатах
PRECISION = 4

# Плотность воды, кг/м3
P_WATER = 997

# Ускорение своодного падения, м/с2
G = 9.80665

# Табличные значения удельных сопротивлений участков
S0 = {
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


def correction(velocity):
    """"
    Находит поправочный коэффициент для выбранной скорости движения вещества.

    Parameters
    ----------
    velocity : flaot
        Скорость движения вещества по участку.

    Returns
    -------
    float
        Значение поправочного коэффициента.
    """
    return 0.852 * pow(1 + 0.867 / float(velocity), 0.3)


def mean(data):
    """"
    Вычисляет математическое ожидание по указанному закону.

    Parameters
    ----------
    data : obj
        Информация о виде распределения.
    data.distrib : {'rav', 'weib', 'beta', 'gamma'}
        Название закона распределения.
    data.param : string, optional
        Значения параметров распределения.

    Returns
    -------
    float
        Численное значение математического ожидания.

    Raises
    ------
    KeyError
        Когда в параметре data нет требуемых полей со значениями параметров указанного распределения.
    Exception
        Когда указано неверное\неподдерживаемое название распределения.

    """

    distrib = data['distrib']

    # Равномерное распределение
    if distrib == 'rav':
        try:
            return (float(data['a']) + float(data['b'])) / 2
        except KeyError:
            print('Параметры равномерного распределения указаны неверно')

    # Распределение Вейбулла
    elif distrib == 'weib':
        try:
            return gamma_func(1 + 1 / float(data['k']))
        except KeyError:
            print('Параметры распределения Вейбулла указаны неверно')

    # Гамма-распределение
    elif distrib == 'gamma':
        try:
            return float(data['k']) * float(data['theta'])
        except KeyError:
            print('Параметры Гамма-распределения указаны неверно')

    # Бета-распределение с переводом интервала из [0; 1] в [a; b]
    elif distrib == 'beta':
        try:
            return float(data['alpha']) * (float(data['a']) + float(data['b'])) / (float(data['alpha']) + float(data['beta']))
        except KeyError:
            print('Параметры бета-распределения указаны неверно')

    else:
        raise Exception('Неверно указано распределение')


# Чтение исходных данных
input = open('./calc/input.json', 'r')
data = json.load(input)
input.close()


# Размерность матрицы инцидентности графа сети
N = len(data['objects']) + 1
M = len(data['pipes']) + 1
matrix = np.zeros(shape=(N, M), dtype=np.int32)


# Заполнение информации об индентификаторах узлов и участков
for i in range(1, N):
    matrix[i, 0] = data['objects'][i-1]['id']

for j in range(1, M):
    matrix[0, j] = data['pipes'][j-1]['id']


# Заполнение матрицы инцидентности
for pipe in data['pipes']:
    for obj in data['objects']:
        if obj['point'] == pipe['point_beg']:
            i = np.where(matrix[1:, 0] == obj['id'])[0][0] + 1
            j = np.where(matrix[0, 1:] == pipe['id'])[0][0] + 1
            matrix[i, j] = 1
        elif obj['point'] == pipe['point_end']:
            i = np.where(matrix[1:, 0] == obj['id'])[0][0] + 1
            j = np.where(matrix[0, 1:] == pipe['id'])[0][0] + 1
            matrix[i, j] = -1


# Переменные с идентификаторами узлов и участков сети
vertices_id = np.array(matrix)[1:, 0]
edges_id = np.array(matrix)[0, 1:]


# Данные по расходам и давлениям на узлах
costs = {}
pressures = {}

# Гидравлические сопротивления участков
resists = {}


for p in data['params']:
    if p['id'] in vertices_id and 'q' in p and p['q'] != '':
        # Если исходные данные не указаны
        if type(p['q']) is dict:
            costs[p['id']] = -mean(data=p['q'])
        else:
            costs[p['id']] = -float(p['q'])
    elif p['id'] in vertices_id and 'h' in p and p['h'] != '':
        pressures[p['id']] = float(p['h']) * P_WATER * G
    elif p['id'] in edges_id:
        # Вычисление гидравлического сопротивления участка
        resists[p['id']] = S0[p['material']][p['diameter']] * float(p['length']) * correction(p['velocity'])


# Нахождение решения методом GGA
P, q = GGA.solve(matrix, costs, pressures, resists)


# Расход на источнике
source_id = next(obj['id'] for obj in data['objects'] if obj['type'] == 'source')
source_param_indx = next(i for i in range(len(data['params'])) if data['params'][i]['id'] == source_id)
data['params'][source_param_indx]['q'] = str(-1 * np.round(sum(list(costs.values())), PRECISION))


# Вывод результатов
for param in data['params']:
    if param['id'] in edges_id:
        param['q'] = str(np.round(q[param['id']], PRECISION))
        param['resist'] = str(np.round(resists[param['id']] / (P_WATER * G), PRECISION))

        # Вычисление величины потерь напора на участке
        k = np.where(matrix[0, 1:] == param['id'])[0][0]

        i = np.where(matrix[1:, k + 1] == 1)[0][0]
        j = np.where(matrix[1:, k + 1] == -1)[0][0]

        # Идентификатор начала и конца участка
        id_beg = matrix[i + 1, 0]
        id_end = matrix[j + 1, 0]

        param['h'] = np.round((P[id_beg] - P[id_end]) / (P_WATER * G), PRECISION)
    elif param['id'] in vertices_id:
        param['h'] = str(np.round(P[param['id']] / (P_WATER * G), PRECISION))

output = open('./calc/output.json', 'w')
json.dump(obj=data, fp=output, ensure_ascii=False)
output.close()


# # Решение через полное моделирование
# # Узлы с неизвестными значениями расхода
# missed_costs = {}
#
# for p in data['params']:
#     if p['id'] in vertices_id and 'q' in p and p['q'] != '':
#         if type(p['q']) is dict:
#             missed_costs[p['id']] = generate(data=p['q'])
#         else:
#             costs[p['id']] = -float(p['q'])
#     elif p['id'] in vertices_id and 'h' in p and p['h'] != '':
#         pressures[p['id']] = float(p['h']) * p_water * g
#     elif p['id'] in edges_id:
#         # Произведение соответствующего s0, длины участка и поправочного коэф.
#         resists[p['id']] = s0[p['material']][p['diameter']] * float(p['length']) * 0.852 * pow(
#             1 + 0.867 / float(p['velocity']), 0.3)
#
# # Выполняем Nr вычислений
# P = {}
# q = {}
#
# for id in vertices_id:
#     P[id] = []
# for id in edges_id:
#     q[id] = []
#
# for i in range(Nr):
#     # Берем одну реализацию
#     for key, values in missed_costs.items():
#         costs[key] = -values[i]
#
#     # Один из множества результатов
#     P_tmp, q_tmp = GGA.solve(matrix, costs, pressures, resists)
#
#     for key, value in P_tmp.items():
#         P[key].append(value)
#     for key, value in q_tmp.items():
#         q[key].append(value)
#
# # Нахождение оценки искомых величин
# for key, value in P.items():
#     P[key] = np.mean(value)
# for key, value in q.items():
#     q[key] = np.mean(value)
