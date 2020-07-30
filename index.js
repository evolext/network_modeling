const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');


const app = express();
var server = require('http').createServer(app);


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

    //console.log(request.body);
});

server.listen(5000);