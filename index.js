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


// Запрос на выполнение гидравлического расчета
app.post('/hydraulic_calc', function(request, response) {

    // Запись полученных данных в файл
    fs.mkdirSync(__dirname + '/calc');
    fs.writeFileSync('./calc/input.json', JSON.stringify(request.body));

    console.log(request.body);

    // // Запуск программы расчета
    // const calc_prog = spawn('./calc_prog/main.exe');
    // // Вывод ошибок на случай некорректного выполнения программы расчетов
    // calc_prog.stderr.on('data', (data) => {
    //     console.error(`stderr: ${data}`);
    // });

    // // По окончании расчетов отправить результаты клиенту
    // calc_prog.on('exit', function () {
    //     let result = JSON.parse(fs.readFileSync('./calc/output.json'));
        
    //     response.send({
    //         data: JSON.stringify(result)
    //     });

    //     // Удаление созданных файлов
    //     fs.rmdirSync(__dirname + '/calc', { recursive: true });
    // });

    response.send({});
});


// Запрос на сохранение схемы
app.post('/save_schema', function(request, response) {
    // Запись полученной информации в файл
    fs.writeFileSync(`./networks/schema_${request.body.global.name}.json`, JSON.stringify(request.body));

    // Уведомление пользователя о сохранении
    response.send({
        status: 0
    });
});


// Запрос списка сохраненных схем
app.get('/list_schema', function (request, response) {
    data = {
        list: []
    }

    for (let filename of fs.readdirSync('./networks')) {
        // Получение имени схемы
        let schema_name = filename.substring('schema_'.length, filename.indexOf('.json'));
        data['list'].push(schema_name);
    }

    // Отправка списка клиенту
    response.send(data);
});


// Запрос сохраненной схемы
app.get('/load_schema', function (request, response) {
    // Имя запрашиваемой схемы
    let schema_name = request.query.schema;

    // Чтение данных по схеме
    let data = JSON.parse(fs.readFileSync(`./networks/schema_${schema_name}.json`));

    // Отправка данных клиенту
    response.send({
        data: JSON.stringify(data)
    });
});



server.listen(5000);