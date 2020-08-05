const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const spawn = require('child_process').spawn;


const app = express();
const server = require('http').createServer(app);


app.use(express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Отбражение главной страницы приложения
app.get('/', function (request, response) {
    response.sendFile(__dirname + "/index.html");
});

// Получение данных от клиента
app.post('/compute', function(request, response) {
    // Создание файлов для сохранения данных
    fs.mkdirSync(__dirname + '/info');
    fs.writeFileSync('info/objects.txt', '');
    fs.writeFileSync('info/pipes.txt', '');
    fs.writeFileSync('info/node_costs.txt', '');

    // Данные о геообъектах
    for (let [key, value] of Object.entries(request.body.vertices))
        fs.appendFileSync('info/objects.txt', `${key}\n${value.lat}\t${value.lng}\n`);
    // Данные о пайпах
    for (let [key, value] of Object.entries(request.body.edges))
        fs.appendFileSync('info/pipes.txt', `${key}\n${value[0].lat}\t${value[0].lng}\n${value[value.length - 1].lat}\t${value[value.length - 1].lng}\n`);
    // Данные о расходах
    for (let [key, value] of Object.entries(request.body.info))
        fs.appendFileSync('info/node_costs.txt', `${key}\n${value.consumption}\n`);


    // Запуск прогрраммы расчетов
    const calc_prog = spawn('calculation\ programs/main.exe');
    // Вывод ошибок на случай некорректного выполнения программы расчетов
    calc_prog.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    // По окончании расчетов отправить результаты клиенту
    calc_prog.on('exit', function () {
        let result = new Map();
        let lines = fs.readFileSync('info/pipe_costs.txt').toString().split('\n');
        for (let i = 0; i < lines.length - 1; i += 2)
            result.set(lines[i], lines[i + 1]);
        
        response.send({
            data: Object.fromEntries(result)
        });

        // Удаление созданных файлов
        fs.rmdirSync(__dirname + '/info', { recursive: true });
    });


    //console.log(request.body);
});

server.listen(5000);