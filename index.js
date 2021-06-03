const express = require("express");
const fs = require("fs");
const spawn = require("child_process").spawn;

const app = express();
const server = require("http").createServer(app);


app.use(express.static(__dirname + "/static"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Отображает главную страницу приложения
app.get("/", function (request, response) {
    response.sendFile(__dirname + "/index.html");
});


// Обрабатывает запрос на выполнение гидравлического расчета
app.post("/hydraulic_calc", function(request, response) {

    // Запись полученных данных в файл
    fs.mkdirSync(__dirname + "/calc");
    fs.writeFileSync("./calc/input.json", JSON.stringify(request.body));

    // Запуск программы расчета
    const calcProgram = spawn("./calc_prog/main.exe");

    // Вывод ошибок на случай некорректного выполнения программы расчетов
    calcProgram.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
    });

    // По окончании расчетов отправляет результаты клиенту и удаляет временные файлы
    calcProgram.on("exit", function () {
        let result = JSON.parse(fs.readFileSync("./calc/output.json"));        
        response.send({
            data: JSON.stringify(result)
        });
        fs.rmdirSync(__dirname + "/calc", { recursive: true });
    });
});


// Обрабатывает запрос на поиск всех путей между двумя вершинами 
// для дальнейшего построения пьзометрического графика
app.post("/find_all_routes", function (request, response) {
    // Запись полученных данных в файл
    fs.mkdirSync(__dirname + "/calc");
    fs.writeFileSync("./calc/input.json", JSON.stringify(request.body));
    response.send({});
});


// Обрабатывает запрос на сохранение схемы
app.post("/save_schema", function(request, response) {
    // Запись полученной информации в файл
    fs.writeFileSync(`./networks/schema_${request.body.global.name}.json`, JSON.stringify(request.body));
    // Уведомление пользователя о сохранении
    response.send({
        status: 0
    });
});


// Обрабатывает запрос на предоставление списка сохраненных схем
app.get("/list_schema", function (request, response) {
    data = {
        list: []
    }

    for (let filename of fs.readdirSync("./networks")) {
        // Получение имени схемы
        let schemaName = filename.substring("schema_".length, filename.indexOf(".json"));
        data["list"].push(schemaName);
    }

    // Отправка списка клиенту
    response.send(data);
});


// Обработка запроса на загурзку сохраненной схемы
app.get("/load_schema", function (request, response) {
    // Имя запрашиваемой схемы
    let schemaName = request.query.schema;
    // Чтение данных по схеме
    let data = JSON.parse(fs.readFileSync(`./networks/schema_${schemaName}.json`));
    // Отправка данных клиенту
    response.send({
        data: JSON.stringify(data)
    });
});

server.listen(5000);
