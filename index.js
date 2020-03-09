var express = require("express");
// Модуль для работы с файлами
var fs = require('fs');
// Модуль для парсинга тела запроса от клиента
const bodyParser = require("body-parser");
// Модуль для создания дочернего процесса
const spawn = require('child_process').spawn;

// Запуск приложения
var app = express();
// Для http-зпросов
var server = require('http').createServer(app);

// Сокет для связи с клиентом
server.listen(5000);

// Инициализация парсера тела запроса
const urlencodedParser = bodyParser.urlencoded({ extended: false });
// Указание директории с файлами
app.use(express.static(__dirname + "/static"));

// Запрос расчет расхода на участках тепловой сети
app.post("/zapros", urlencodedParser, function (request, response) {
   // Очистка текстовых файлов с данными
   fs.writeFileSync("info/sources.txt", "", function () {});
   fs.writeFileSync("info/heatchambers.txt", "", function () {});
   fs.writeFileSync("info/recievers.txt", "", function () {});
   fs.writeFileSync("info/branches.txt", "", function () {});
   fs.writeFileSync("info/pipes.txt", "", function () {});
   fs.writeFileSync("info/node_costs.txt", "", function () {});


   // Получаем данные от клиента (координаты + id объектов)
   //console.log(request.body);
   
   // Данные об источниках
   for (let i = 0; request.body['sources[' + i.toString() + '][coord][]'] != undefined; i++)
      fs.appendFileSync("info/sources.txt", request.body['sources[' + i.toString() + '][coord][]'] + '\t' + request.body['sources[' + i.toString() + '][id]'] + '\n', function () { });
   // Данные о тепловых камерах
   for (let i = 0; request.body['heatchambers[' + i.toString() + '][coord][]'] != undefined; i++)
      fs.appendFileSync("info/heatchambers.txt", request.body['heatchambers[' + i.toString() + '][coord][]'] + '\t' + request.body['heatchambers[' + i.toString() + '][id]'] + '\n', function () { });
   // данные о приёмниках
   for (let i = 0; request.body['recievers[' + i.toString() + '][coord][]'] != undefined; i++)
      fs.appendFileSync("info/recievers.txt", request.body['recievers[' + i.toString() + '][coord][]'] + '\t' + request.body['recievers[' + i.toString() + '][id]'] + '\n', function () { });
   // Данные об ответвлениях
   for (let i = 0; request.body['branches[' + i.toString() + '][coord][]'] != undefined; i++)
      fs.appendFileSync("info/branches.txt", request.body['branches[' + i.toString() + '][coord][]'] + '\t' + request.body['branches[' + i.toString() + '][id]'] + '\n', function () { });

   // Данные об участках
   var array = [];
   var j = 0;
   for (let i = 0; request.body['pipes[' + i.toString() + '][coord][0][]'] != undefined; i++)
   {
      array.push((request.body['pipes[' + i.toString() + '][coord][0][]']).toString() + '\n');
      for (j = 0; request.body['pipes[' + i.toString() + '][coord][' + j.toString() + '][]'] != undefined; j++);
      array.push((request.body['pipes[' + i.toString() + '][coord][' + (j - 1).toString() + '][]']).toString() + '\n');
      array.push((request.body['pipes[' + i.toString() + '][id]']) + '\n');
      array.push("#\n");
   }
   for (let i = 0; i < array.length; i++)
      fs.appendFileSync("info/pipes.txt", array[i], function() {});

   for (let i = 0; request.body['nodes_costs[' + i.toString() + '][id]'] != undefined; i++)
   {
      fs.appendFileSync("info/node_costs.txt", request.body['nodes_costs[' + i.toString() + '][value][value]'] + '\t' + request.body['nodes_costs[' + i.toString() + '][id]'] + '\n', function () { });
   }


   // Запуск программы расчетов
   const example = spawn('main/main.exe', []);
   // Поток ошибок на случай некорректной рабоыт программы расчетов
   example.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
   });
   // По оконачнии расчетов высылаем результаты клиенту
   example.on('exit', function () {
      var data = [];
      var help;
      // Считывание ответа из файла
      var arr = fs.readFileSync("info/way_costs.txt", "utf8", function () { }).toString();
      var split_lines = arr.split('\n');
      
      for (let i = 0; i < split_lines.length - 1; i++)
      {
         help = split_lines[i].split('\t');
         data.push({'id': help[1].replace('\r', ''), 'value': help[0]});
      }
      
      //Ответ клиенту
      response.send(data);
   })
});

// Отбражение главной страницы приложения
app.get('/', function (request, respons) {
   respons.sendFile(__dirname + "/main.html");
});