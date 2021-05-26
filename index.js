const express = require('express');
const fs = require('fs');
const spawn = require('child_process').spawn;


const app = express();
const server = require('http').createServer(app);


app.use(express.static(__dirname + '/static'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Отбражение главной страницы приложения
app.get('/', function (request, response) {
    response.sendFile(__dirname + "/index.html");
});

// Отправка данных для загрузки схемы
app.get('/load', function(request, response) {
    let network = {};
    network.vertices = {};
    network.edges = {};

    // Глобальное id и центр карты
    let info = fs.readFileSync('networks/global.txt').toString().split('\n');
    network.id = Number(info[0]);
    network.center = {
        lat: Number(info[1].split('\t')[0]),
        lng: Number(info[1].split('\t')[1])
    };

    // Инфомрация об объектах
    info = fs.readFileSync('networks/objects.txt').toString().split('\n');
    for (let i = 0; i < info.length - 1; i += 5) {
        network.vertices[info[i]] = {
            type: info[i + 1],
            info: {
                activity: info[i + 2],
                consumption: info[i + 3]
            },
            coord: {
                lat: Number(info[i + 4].split('\t')[0]),
                lng: Number(info[i + 4].split('\t')[1])
            }
        }
    }

    // Информация о пайпах
    info = fs.readFileSync('networks/pipes.txt').toString().split('\n');
    let j;
    for (let i = 0; i < info.length - 1;) {
        network.edges[info[i]] = {
            info: {
                activity: info[i + 1]
            },
            coords: []
        };
        j = i + 2;
        while (true) {
            if (info[j] != '#') {
                network.edges[info[i]].coords.push({
                    lat: Number(info[j].split('\t')[0]),
                    lng: Number(info[j].split('\t')[1])
                });
                j++;
            }
            else {
                i = j + 1;
                break;
            }
        }
    }

    response.send(network);
});


// Запрос на выполнение гидравлического расчета
app.post('/hydraulic_calc', function(request, response) {

    // Запись полученных данных в файл
    fs.mkdirSync(__dirname + '/calc');
    fs.writeFileSync('./calc/input.json', JSON.stringify(request.body));

    // Запуск программы расчета
    const calc_prog = spawn('./calc_prog/main.exe');
    // Вывод ошибок на случай некорректного выполнения программы расчетов
    calc_prog.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    // По окончании расчетов отправить результаты клиенту
    calc_prog.on('exit', function () {
        let result = JSON.parse(fs.readFileSync('./calc/output.json'));
        
        response.send({
            data: JSON.stringify(result)
        });

        // Удаление созданных файлов
        fs.rmdirSync(__dirname + '/calc', { recursive: true });

        // Вывод инфомрации в консоль
        console.log('Гидравлические расчеты проведены успешно');
    });
});


// Получение данных для сохранения
app.post('/save_schema', function(request, response) {
    // Запись полученной информации в файл
    fs.writeFileSync(`./networks/schema_${request.body.global.name}.json`, JSON.stringify(request.body));

    // Уведомление пользователя о сохранении
    response.send({
        status: 0
    });
});

server.listen(5000);