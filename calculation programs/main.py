

# Функция нахождения индекса строки или столбца с указанным идентификатором
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


# Считывание инфомрации о геообъектах
objects_info = open('info/objects.txt', 'r')
for line in objects_info:
    id = line.strip('\n')
    split_line = objects_info.readline().split('\t')
    split_line[1] = split_line[1].strip('\n')
    vertices[id] = split_line.copy()
objects_info.close()


# Считывание инфомрации о пайпах
pipes_info = open('info/pipes.txt', 'r')
for line in pipes_info:
    id = line.strip('\n')
    split_line = pipes_info.readline().split('\t')
    end_x = split_line[0]
    end_y = split_line[1].strip('\n')
    split_line = pipes_info.readline().split('\t')
    start_x = split_line[0]
    start_y = split_line[1].strip('\n')
    edges[id] = [[start_x, start_y], [end_x, end_y]]
pipes_info.close()


# Размерность матрицы инцидентности
N = len(vertices) + 1
M = len(edges) + 1
matrix = [[0 for j in range(M)] for i in range(N)]

# Заполнение информации об индентификаторах объектов и соединений
for i in range(len(vertices.keys())):
    matrix[i + 1][0] = list(vertices.keys())[i]

for i in range(len(edges.keys())):
    matrix[0][i + 1] = list(edges.keys())[i]

# Заполнение матрицы инцидентности
for key_pipe, pipe in edges.items():            # Проход по всем пайпам
    for node in pipe:                           # Проход по узлам пайпа
        for key_obj, obj in vertices.items():   # Сравниваем координаты узла пайпа с координатами геообъекта
            if node == obj:
                matrix[get_index(matrix, key_obj, True)][get_index(matrix, key_pipe, False)] = 1 if node == pipe[0] else -1






for i in range(len(matrix)):
    for j in range(len(matrix[0])):
        print(matrix[i][j], end='\t')
    print()

