#include <iostream>
#include <fstream>
#include <vector>
#include <string>

using namespace std;

struct point
{
    string x;
    string y;
};

class Matrix
{
    public:
        Matrix(int n, int m)
        {
            N = n;
            M = m;

            Elem.resize(N);
            for (int i = 0; i < N; i++)
                Elem[i].resize(M);

            for (int i = 0; i < N; i++)
            {
                for (int j = 0; j < M; j++)
                    Elem[i][j] = 0;
            }
        }
        int N, M;
        vector<vector<int>> Elem;

        vector<double> GaussMethod(vector<double> X)
        {
            vector<double> result;
            result.resize(M);
            int index = 0;
            int temp = 0;
            vector<int> row_temp;
            row_temp.resize(M);

            for (int j = 0; j < M; j++)
            {
                index = j;
                if (Elem[j][j] != 1)
                {
                    // Находим строку с максимальным элементом
                    for (int i = j + 1; i < N; i++)
                    {
                        if (Elem[i][j] == 1)
                        {
                            index = i;
                            i = N;
                        }
                    }
                }

                // Перестановка строк
                if (index != j)
                {
                    // Перестановка для матрицы
                    for (int k = 0; k < M; k++)
                        row_temp[k] = Elem[j][k];
                    Elem[j] = Elem[index];
                    Elem[index] = row_temp;
                    // Перестановка для вектора правой части
                    temp = X[j];
                    X[j] = X[index];
                    X[index] = temp;
                }

                for (int i = j + 1; i < N; i++)
                {
                    if (Elem[i][j] != 0)
                    {
                        // Строка i - строка j
                        for (int k = 0; k < M; k++)
                            Elem[i][k] -= Elem[j][k];
                        // Изменяем вектор правой части
                        X[i] -= X[j];
                    }
                }
            }

            

            for (int k = N - 2; k >= 0; k--)
            {
                result[k] = X[k];
                for (int i = 0; i < k; i++)
                    X[i] -= Elem[i][k] * result[k];
            }

            return result;
        }
};

int main()
{
    string x, y; // Вспомогательные переменные
    vector<point> sources, heatchambers, branches, recievers;
    vector<vector<point>> pipes; // информация о трубах
    vector<point> pipe; // вспомогательный вектор
    fstream fin;
    ofstream fout;

    vector<double> node_coasts;

    // Считываем координаты источников
    fin.open("info/sources.txt");
    while (!fin.eof())
    {
        getline(fin, y, ',');
        getline(fin, x);
        if (y != "")
            sources.push_back({ x, y });  
    }
    fin.close();
    // Координаты тепловых камер
    fin.open("info/heatchambers.txt");
    while (!fin.eof())
    {
        getline(fin, y, ',');
        getline(fin, x);
        if (y != "")
            heatchambers.push_back({ x, y });
    }
    fin.close();
    // Координаты ответвлений
    fin.open("info/branches.txt");
    while (!fin.eof())
    {
        getline(fin, y, ',');
        getline(fin, x);
        if (y != "")
            branches.push_back({ x, y });
    }
    fin.close();
    // Координаты конечных узлов
    fin.open("info/recievers.txt");
    while (!fin.eof())
    {
        getline(fin, y, ',');
        getline(fin, x);
        if (y != "")
            recievers.push_back({ x, y });
    }
    fin.close();


    char ch = 0;
    // Считываем данные о трубах
    fin.open("info/pipes.txt");
  
    while (!fin.eof())
    {
        fin >> ch;
        if (ch != 35) // символ '#'
        {
            getline(fin, y, ',');
            // возвращаем символ
            y.insert(y.begin(), ch);
            getline(fin, x);
            pipe.push_back({ x, y });
        }
        else if (!fin.eof())
        {
            pipes.push_back(pipe);
            pipe.clear();
        }
    }
    fin.close();

    // Считывание вектора расходов на узлах
    double help;
    fin.open("info/node_coasts.txt");
    while (!fin.eof())
    {
        fin >> help;
        if (!fin.eof())
            node_coasts.push_back(help);
    }
    fin.close();

    int N = sources.size() + heatchambers.size() + recievers.size() + branches.size();
    // Количества
    int numOfSources = sources.size();
    int numOfHeatchambers = heatchambers.size();
    int numOfRecievers = recievers.size();
    int numOfBranches = branches.size();

    Matrix matrix(N, N - 1);

    // Построеине графа
    point temp;

    int q = 0;
    int column = 0;
    for (int i = 0; i < pipes.size(); i++)
    {
        for (int j = 0; j < pipes[i].size(); j++)
        {
            temp = pipes[i][j];
            // Поиск соответствий среди источников
            for (int k = 0; k < numOfSources; k++)
            {
                if (sources[k].x == temp.x && sources[k].y == temp.y)
                {
                    matrix.Elem[k][column] = 1;
                    q++;
                }
            }
            // Поиск соответствий среди тепловых камер
            for (int k = 0; k < numOfHeatchambers; k++)
            {
                if (heatchambers[k].x == temp.x && heatchambers[k].y == temp.y)
                {
                    matrix.Elem[numOfSources + k][column] = 1;
                    q++;
                }
            }
            // Поиск соответствий среди ответвлений
            for (int k = 0; k < numOfBranches; k++)
            {
                if (branches[k].x == temp.x && branches[k].y == temp.y)
                {
                    matrix.Elem[numOfSources + numOfHeatchambers + k][column] = 1;
                    q++;
                }
            }
            // Поиск соответствий среди приёмников
            for (int k = 0; k < numOfRecievers; k++)
            {
                if (recievers[k].x == temp.x && recievers[k].y == temp.y)
                {
                    matrix.Elem[numOfSources + numOfHeatchambers + numOfBranches + k][column] = 1;
                    q++;
                }
            }
        }
        if (q == 2)
        {
            column++;
            q = 0;
        }
    }

    vector<double> result = matrix.GaussMethod(node_coasts);

    fout.open("info/X.txt");
    for (int i = 0; i < result.size(); i++)
        fout << result[i] << endl;

    fout.close();
}