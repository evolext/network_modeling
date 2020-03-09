import numpy as np

branches = {}
heatchambers = {}
recievers = {}
sources = {}
pipes = {}
nodes_costs = {}

# Функция записи информации об объектах из файлов в структуры
def parse_info_objects(info_file, object_dict):
    for line in info_file:
        if line != '\n':
            split_line1 = line.split(',')
            y = split_line1[0]
            split_line2 = split_line1[1].split('\t')
            x = split_line2[0]
            id = split_line2[1].strip('\n')
            object_dict[id] = [x, y]


# Функция записи информации о соединениях из файлов в структуру
def parse_info_pipes(info_file, pipe_dict):
    for line in info_file:
        if line != '\n':
            split_line = line.split(',')
            start_y = split_line[0]
            start_x = split_line[1].strip('\n')
            split_line = info_file.readline().split(',')
            end_y = split_line[0]
            end_x = split_line[1].strip('\n')
            id = info_file.readline().strip('\n')
            info_file.readline() # Считывание разделителя
            pipe_dict[id] = [[start_x, start_y], [end_x, end_y]]


# Функция записи информации о расходах на узлах из файлов в структуру
def parse_info_node_costs(info_file, costs_dict):
    for line in info_file:
        split_line = line.split('\t')
        id = split_line[1].strip('\n')
        costs_dict[id] = float(split_line[0])

# Считывание информации об источниках
sources_info = open('info/sources.txt', 'r')
parse_info_objects(sources_info, sources)
sources_info.close()

# Считывание информации о тепловых камерах
heatchambers_info = open('info/heatchambers.txt', 'r')
parse_info_objects(heatchambers_info, heatchambers)
heatchambers_info.close()

# Считывание информации о промежуточных узлах
branches_info = open('info/branches.txt', 'r')
parse_info_objects(branches_info, branches)
branches_info.close()

# Считывание информации о конечных узлах
recievers_info = open('info/recievers.txt', 'r')
parse_info_objects(recievers_info, recievers)
recievers_info.close()

# Считывание информации о соединениях
pipes_info = open('info/pipes.txt', 'r')
parse_info_pipes(pipes_info, pipes)
pipes_info.close()

# Считывание информации о расходах на узлах
nodes_costs_info = open('info/node_costs.txt', 'r')
parse_info_node_costs(nodes_costs_info, nodes_costs)
nodes_costs_info.close()


# Размерность матрицы инцидентности
N = len(sources) + len(heatchambers) + len(branches) + len(recievers) + 1
M = len(pipes) + 1

# Создание пустой матрицы инцидентности
matrix = [[0 for j in range(M)] for i in range(N)]

# Объекты для индексации в матрице
objects_id = []
pipes_id = []
# Заполнение информации об индентификаторах объектов и соединений
i = 1
for elem in sources:
    matrix[i][0] = int(elem)
    objects_id.append(int(elem))
    i += 1
for elem in heatchambers:
    matrix[i][0] = int(elem)
    objects_id.append(int(elem))
    i += 1
for elem in branches:
    matrix[i][0] = int(elem)
    objects_id.append(int(elem))
    i += 1
for elem in recievers:
    matrix[i][0] = int(elem)
    objects_id.append(int(elem))
    i += 1
j = 1
for elem in pipes:
    matrix[0][j] = int(elem)
    pipes_id.append(int(elem))
    j += 1

# Заполнение матрицы инцидентности
for i in pipes: # Проход по всем сединениям сети
    for elem in pipes[i]: # Проход по всем узлам соединения
        # Проход по всем элементам для поиска соответствия
        for obj in sources:         # Проход по источникам
            if sources[obj][0] == elem[0] and sources[obj][1] == elem[1]:
                matrix[objects_id.index(int(obj)) + 1][pipes_id.index(int(i)) + 1] = 1
        for obj in heatchambers:    # Проход по тепловым камерам
            if heatchambers[obj][0] == elem[0] and heatchambers[obj][1] == elem[1]:
                matrix[objects_id.index(int(obj)) + 1][pipes_id.index(int(i)) + 1] = 1
        for obj in branches:        # Проход по промежуточным узлам
            if branches[obj][0] == elem[0] and branches[obj][1] == elem[1]:
                matrix[objects_id.index(int(obj)) + 1][pipes_id.index(int(i)) + 1] = 1
        for obj in recievers:       # Проход по конечным узлам
            if recievers[obj][0] == elem[0] and recievers[obj][1] == elem[1]:
                matrix[objects_id.index(int(obj)) + 1][pipes_id.index(int(i)) + 1] = 1


# Формируем вектор правой части для решения уравнения
b = []
for i in range(1, len(matrix)):
    b.append(nodes_costs.get(str(matrix[i][0])))

# Формируем матрицу для решения уравнения
A = [[0 for j in range(len(matrix[0]) - 1)] for i in range(len(matrix)- 2)]
for i in range(1, len(matrix) - 1):
    for j in range(1, len(matrix[0])):
        A[i - 1][j - 1] = matrix[i][j]

# Решение СЛАУ
X = np.linalg.solve(np.array(A), np.array(b[:-1]))

# Вывод полученных результатов в файл
output_file = open('info/way_costs.txt', 'w')
for j in range(len(X)):
    print('{0}\t{1}'.format(X[j], matrix[0][j + 1]), file = output_file)

output_file.close()