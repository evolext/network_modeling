import numpy as np


def F(s, q):
    """"
    Вычисляет функцию потерь (квадратичную).

    Parameters
    ----------
    s : list
        Значения гидравлических сопротивлений участков сети.
    q : list
        Значения пропускных способностей участков сети.

    Returns
    -------
    list
        Значение функции потерь для всех участков сети по формуле: s*q^2.
    """
    return np.array([s[i] * pow(q[i], 2) for i in range(len(q))])


def D(s, q):
    """"
    Вычисляет диагональную матрицу производных функции потерь.

    Parameters
    ----------
    s : list
        Значения гидравлических сопротивлений участков сети.
    q : list
        Значения пропускных способностей участков сети.

    Returns
    -------
    list
    """
    return np.diag([2*s[i]*q[i] for i in range(len(q))])


def M(s, q, A_1):
    """"
    Вычисляет матрицу Максвелла при заданных значениях расхода q.

    Parameters
    ----------
    s : list
        Значения гидравлических сопротивлений участков сети.
    q : list
        Значения пропускных способностей участков сети.
    A_1:
        Матрица инцидентности графа сети, соответствующая узлам сети с заданными значениями напора.

    Returns
    -------
    2-nd list
    """
    tmp = np.matmul(A_1, np.linalg.inv(D(s, q)))
    return np.matmul(tmp, A_1.T)


# Основная функция нахождения решения

def solve(matrix, costs, pressures, resists, eps=1e-9):
    """"
    Находит решение методом Глобального Градиента (GGA).

    Parameters
    ----------
    matrix : ndarray
        Матрица инцидентности графа сети без иденитфикаторов геообъектов.
    costs : dict
        Данные о расходах на узлах.
    pressure : dict
        Данные о напорах на узлах.
    resists : dict
        Гидравлические сопротивления на участках.
    eps : float (default 1e-9)
        Необходимая точность решения.

    Returns
    -------
    P : dict
        Рассчитаные значения напоров на узлах сети.
    q : dict
        Рассчитанные значения расходов на узлах сети.

    Raises
    ------
    Exception
        Если указаны данные неполностью по каким-либо параметрам сети.
    """

    # Индексы строк матрицы A, входящих в A_0 (матрица узлов с напорами)
    indx_0 = []

    # Индексы строк матрицы A, входящих в A_1 (матрица узлов с расходами)
    indx_1 = []

    for i in range(1, len(matrix)):
        if matrix[i][0] in list(pressures.keys()):
            indx_0.append(i)
        elif matrix[i][0] in list(costs.keys()):
            indx_1.append(i)
        else:
            raise Exception('Исходные данные по расходам и напорам неполные')

    # Матрицы инцидентности
    A_0 = np.array(matrix)[indx_0]
    A_1 = np.array(matrix)[indx_1]
    A = np.array(matrix)[1:, 1:].astype('int32')

    # Формирование векторов
    s = [resists[key] for key in matrix[0][1:]]

    Q_1 = [costs[key] for key in A_1[:, 0]]
    A_1 = A_1[:, 1:].astype('int32')

    P_0 = [pressures[key] for key in A_0[:, 0]]

    # Начальные неизвестные давления принимаем за ноль
    P_1 = [0 for i in range(len(A_1))]

    P = []
    for i in range(1, len(matrix)):
        if i in indx_0:
            P.append(pressures[matrix[i][0]])
        else:
            P.append(0)
    P = np.array(P, dtype=np.float)

    # Первое приближение
    q_new = np.linalg.lstsq(A_1, Q_1, rcond=-1)[0]

    # Последующие приближения
    P_new = np.copy(P)
    P_old = np.copy(P)

    P_1_new = np.copy(P_1)

    # Файл записи логов
    log = open('./calc/logs.txt', 'w')

    k = 1
    while True:

        P_old = np.copy(P_new)
        q_old = np.copy(q_new)
        P_1_old = np.copy(P_1_new)

        # Нахождение напора
        tmp1 = np.matmul(A_1, np.linalg.inv(D(s, q_old)))
        tmp2 = np.matmul(A.T, P_old) - F(s, q_old)

        tmp3 = Q_1 - np.matmul(A_1, q_old) - np.matmul(tmp1, tmp2)

        P_1_new = P_1_old + np.matmul(np.linalg.inv(M(s, q_old, A_1)), tmp3)

        # Запись ответа
        for i in range(len(indx_1)):
            P_new[indx_1[i]-1] = P_1_new[i]

        # Нахождение расхода
        tmp4 = np.linalg.inv(D(s, q_old))
        tmp5 = np.matmul(A.T, P_new) - F(s, q_old)

        q_new = q_old + np.matmul(tmp4, tmp5)

        norm2_H = np.linalg.norm(P_old - P_new)
        norm2_q = np.linalg.norm(q_old - q_new)

        print('Итерация №{0}\nНорма P: {1}\nНорма q: {2}\n'.format(k, norm2_H, norm2_q), file=log)

        if norm2_H < eps and norm2_q < eps or k > 1000:
            break
        else:
            k += 1

    log.close()

    # Формирование ответов
    P = {}
    q = {}

    for i in range(len(P_new)):
        P[matrix[i+1][0]] = P_new[i]

    for j in range(len(q_new)):
        q[matrix[0][j+1]] = q_new[j]

    return P, q

