//////////////////////////////////////////////////////////////////
// Модуль для управления внешним видом и функционалом кнопок меню
//////////////////////////////////////////////////////////////////


// ------------------------------------------- Управление видом меню ---------------------------------------------


// Отображает инструменты для работы в выбранном режиме
// @water - флаг инициализации инструментов для отрисовки схемы водоснбажения (в случае true)
//          и для отрисовки схемы теплоснабжения (в случае false)
function chooseMode(water) {
    // Установка глобального режима
    app.mode = water ? "WATER" : "HEAT";

    // Cкрытие кнопок выбора режима
    document.getElementById("createWaterNetwork").hidden = true;
    document.getElementById("createHeatNetwork").hidden = true;

    // Отображение кнопок управления схемой
    document.getElementById("createNetwork").hidden = false;
    document.getElementById("loadNetwork").hidden = false;

    // Добавление кнопки выхода из выбранного режима
    let title = water ? "(схема ВС)" : "(схема ТС)";
    document.getElementById("buttonsOfControlSchema").querySelector("h1").innerText = "Управление " + title;
    document.getElementById("cancelCreateNetwork").hidden = false;
}


// Завершает работу приложения в выбранном ранее режиме
function exitMode() {
    // Отображение кнопок выбора режима
    document.getElementById("createWaterNetwork").hidden = false;
    document.getElementById("createHeatNetwork").hidden = false;
    
    document.getElementById("buttonsOfControlSchema").querySelector("h1").innerText = "Режим работы";
    document.getElementById("cancelCreateNetwork").hidden = true;

    // Скрытие кнопок управления схемой
    document.getElementById("createNetwork").hidden = true;
    document.getElementById("loadNetwork").hidden = true;
    document.getElementById("saveNetwork").hidden = true;

    // Скрытия панели добавления объектов
    document.getElementById("addingNodes").style.display = "none";

    // Скрытие панели расчетов
    document.getElementById("calcPanel").style.display = "none";

    // Блокировка кнопки сохранения схемы
    document.getElementById("saveNetwork").disabled = true;

    // Очищение глобальных объектов и чистка рабочей повехности
    app.id = 0;

    for (let i = 0; i < app.geoObjects.length; i++)
        app.geoObjects[i].value.remove();
    for (let pipe of app.pipes.values())
        pipe.remove();
    for (let decorator of app.pipesArrows.values())
        decorator.remove();

    app.geoObjects.length = 0;
    app.pipes.clear();
    app.objectsInfo.clear();
    app.pipesArrows.clear();

    app.polylineEditor = undefined;
    app.editableId = null;
    app.editablePopup = null;
    app.pipePopup = null;

    app.mode = "NONE";
}


// Инициализирует глобальные объекты для новой схемы
function createNetwork() {
    // Флаг режима
    water = app.mode == "WATER";

    // Изменение панели управления схемой
    document.getElementById("createNetwork").hidden = true;
    document.getElementById("loadNetwork").hidden = true;
    document.getElementById("saveNetwork").hidden = false;

    // Отображение панели инструментов
    let block = document.getElementById("addingNodes");
    block.hidden = false;
    block.style.display = "flex";
    block.style.flexDirection = "column";
    block.style.alignItems = "center";

    // Отображение панели расчетов (пока только для водопроводных сетей)
    if (water) {
        calc_panel = document.getElementById("calcPanel");
        calc_panel.hidden = false;
        calc_panel.style.display = "flex";
        calc_panel.style.flexDirection = "column";
        calc_panel.style.alignItems = "center";
    }

    // Отображение кнопок добавления объектов
    for (let button of document.querySelectorAll("#addingNodes button")) {
        button.hidden = (!button.classList.contains("heat") && !water) ? true : false;
    }

    // Изменение некоторых иконок на кнопках (зависит от выбранного режима)
    let label = document.querySelector("#buttonAddWell label");
    label.innerText = water ? "Водопроводный колодец" : "Тепловая камера";

    let source = document.querySelector("#buttonAddSource");
    source.style.backgroundImage = `url(./images/panel_icons/${app.mode.toLowerCase()}/source.png)`;
    source.style.backgroundPositionY = water ? "3px" : "-1px";

    let chamber = document.querySelector("#buttonAddWell");
    chamber.style.backgroundImage = `url(./images/panel_icons/${app.mode.toLowerCase()}/well.png)`;
    chamber.style.backgroundSize = water ? "25px" : "30px";
    chamber.style.backgroundPositionX = water ? "4px" : "0px";
    chamber.style.backgroundPositionY = water ? "1px" : "0px";

    let consumer = document.querySelector("#buttonAddConsumer");
    consumer.style.backgroundImage = `url(./images/panel_icons/${app.mode.toLowerCase()}/consumer.png)`;
    consumer.style.backgroundSize = water ? "23px" : "20px";
    consumer.style.backgroundPositionX = water ? "4px" : "5px";
    consumer.style.backgroundPositionY = water ? "2px" : "3px";
}


// ------------------------------------------- Управление расчетами ---------------------------------------------


// Выполнение гидравлического расчета
function hydraulicСalc() {
        
    // Формирование объекта с исходными данными для отправки
    data = {
        "objects": [],
        "pipes": [],
        "params": []
    }

    // id узлов и их коориднаты
    for (let obj of app.geoObjects) {
        let point = obj.value.getLatLng();

        data["objects"].push({
            "id": obj.id,
            "type": obj.type,
            "point": [point["lat"].toString(), point["lng"].toString()]
        });
    }

    // id участков и координаты их начала и конца
    for (let [key, value] of app.pipes.entries()) {
        let points = value.getLatLngs();

        data["pipes"].push({
            "id": key,
            "point_beg": [points[points.length - 1]["lat"].toString(), points[points.length - 1]["lng"].toString()],
            "point_end": [points[0]["lat"].toString(), points[0]["lng"].toString()]
        });
    }

    // Гидравлические характеристики объектов сети
    for (let [key, value] of app.objectsInfo) {
        // (value и так содержит все свйоства, кроме id объекта, поэтому просто создаем копию value и дополняем id)
        data["params"].push(Object.assign({"id": key}, value));
    }

    // Отправка данных на сервер
    fetch("/hydraulic_calc", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(function(body) {
        let newParams = JSON.parse(body.data)["params"];
        
        // Обновление гидравлических характеристик объектов
        for (let i = 0; i < newParams.length; i++) {
            let objectInfo = app.objectsInfo.get(newParams[i].id);

            for (let key of Object.keys(objectInfo)) {
                objectInfo[key] = newParams[i][key];               
            }
        }
        // Уведомление пользователя
        alert("Гидравлические расчеты проведены успешно");
    })
    .catch(err => console.error(err));
}


// Показ окна для построения пьезометрического графика
function showPlotPopup() {
    // Создание окна
    let plotPopup = document.createElement("div");
    plotPopup.setAttribute("id", "plotPopup");

    let title = document.createElement("p");
    title.innerText = "Пьезометрический график";

    let crossIcon = document.createElement("img");
    crossIcon.setAttribute("src", "./images/cross.png");

    let crossButton = document.createElement("a");
    crossButton.setAttribute("id", "cross");
    crossButton.append(crossIcon);
    crossButton.onclick = closePlotPopup;

    let table = document.createElement("table");

    let firstOptionBeg = document.createElement("option");
    firstOptionBeg.innerText = "Не выбран";
    firstOptionBeg.setAttribute("disabled", "");
    firstOptionBeg.setAttribute("selected", "");
    firstOptionBeg.setAttribute("value", "none");

    let firstOptionEnd = firstOptionBeg.cloneNode(true);

    let selectBeg = document.createElement("select");
    let selectEnd = document.createElement("select");

    selectBeg.setAttribute("id", "begNode");
    selectBeg.append(firstOptionBeg);

    selectEnd.setAttribute("id", "endNode");
    selectEnd.append(firstOptionEnd);

    let tdTitleBeg = document.createElement("td");
    tdTitleBeg.innerText = "Начальный узел: ";

    let tdTitleEnd = document.createElement("td");
    tdTitleEnd.innerText = "Конечный узел: ";

    let tdSelectBeg = document.createElement("td");
    tdSelectBeg.append(selectBeg);

    let tdSelectEnd = document.createElement("td");
    tdSelectEnd.append(selectEnd);

    let firstRow = document.createElement("tr");
    firstRow.append(tdTitleBeg, tdSelectBeg);

    let secondRow = document.createElement("tr");
    secondRow.append(tdTitleEnd, tdSelectEnd);

    table.append(firstRow, secondRow);

    let buttonFindRoutes = document.createElement("button");
    buttonFindRoutes.innerText = "Найти маршруты";
    buttonFindRoutes.setAttribute("disabled", "");
    buttonFindRoutes.onclick = findAllRoutes;

    plotPopup.append(title, crossButton, table, buttonFindRoutes);
    document.getElementById("blackout").before(plotPopup);

    // Настройка окна
    selectBeg.value = "none";
    selectEnd.value = "none";

    selectBeg.onchange = piezometricSetNode;
    selectEnd.onchange = piezometricSetNode;

    // Заполнение выпадающих списков для выбора узлов
    for (let obj of app.geoObjects) {
        let option = document.createElement("option");
        option.setAttribute("value", obj.id);
        option.innerText = app.objectsInfo.get(obj.id).name;

        selectBeg.append(option);
        selectEnd.append(option.cloneNode(true));
    }

    // Придание окну свойства подвижности
    dragElement(plotPopup);
}


// Поиск всех возможных путей от начально до конечной вершин
function findAllRoutes() {
    data = {
        "objects": [],
        "pipes": [],
        "route": {
            // Идентификаторы узлов начала и конца пути
            "start": document.getElementById("begNode").value,
            "end": document.getElementById("endNode").value
        }
    }

    // id узлов и их коориднаты
    for (let obj of app.geoObjects) {
        let point = obj.value.getLatLng();

        data["objects"].push({
            "id": obj.id,
            "point": [point["lat"].toString(), point["lng"].toString()]
        });
    }

    // id участков и координаты их начала и конца
    for (let [key, value] of app.pipes.entries()) {
        let points = value.getLatLngs();

        data["pipes"].push({
            "id": key,
            "point_beg": [points[points.length - 1]["lat"].toString(), points[points.length - 1]["lng"].toString()],
            "point_end": [points[0]["lat"].toString(), points[0]["lng"].toString()]
        });
    }

    // Отправка данных на сервер
    fetch("/find_all_routes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(function(body) {
        // Количество найденных маршрутов
        let routesCount = body.paths.length;

        // Отображение панели с выбором маршрута
        let routesContainer = document.createElement("div");
        routesContainer.setAttribute("id", "routes");

        let span = document.createElement("span");

        if (routesCount == 0) {
            span.innerText = "Маршруты не найдены";
            routesContainer.append(span);
            routesContainer.style.justifyContent = "center";
        }
        else {
            span.innerText = "Маршрут: ";
            let routesList = document.createElement("select");
            routesList.setAttribute("id", "routesList");
            routesList.dataset.prevValue = "none";

            let firstOption = document.createElement("option");
            firstOption.innerText = "Не выбран";
            firstOption.setAttribute("disabled", "1");
            firstOption.setAttribute("selected", "1");
            firstOption.setAttribute("value", "none");
    
            routesList.append(firstOption);

            for (let i = 0; i < routesCount;  i++) {
                let option = document.createElement("option");
                option.innerText = `Маршрут #${i+1}`;
                // "Зашиваем" путь в атрибут value
                option.setAttribute("value", body.paths[i].join('_'))
                routesList.append(option);
            }

            routesList.onchange = paintRoute;
            routesContainer.append(span, routesList);
        }

        document.getElementById("plotPopup").append(routesContainer);

        // Кнопка для построения графика
        if (routesCount != 0) {
            let buttonPlot = document.createElement("button");
            buttonPlot.innerText = "Построить график";
            buttonPlot.setAttribute("id", "piezoPlot");
            buttonPlot.setAttribute("disabled", "1");
            buttonPlot.onclick = piezoPlot;
            document.getElementById("plotPopup").append(buttonPlot);
        }

        // Блокирование кнопки, чтобы не повторять поиск
        document.querySelector("#plotPopup button").disabled = true;
    })
    .catch(err => console.error(err));
}


// Выделяет цветом выбранный для отображения на пьезометрическом график маршрут
function paintRoute() {
    let routesList = document.getElementById("routesList");
    
    if (routesList.dataset.prevValue != "none") {
        repaintRoute();
    }

    let route = routesList.value.split('_');

    for (let i = 1; i < route.length; i += 2) {
        let pipe = app.pipes.get(Number(route[i]));
    
        pipe.setStyle({
            color: 'red'
        });
    }

    document.getElementById("piezoPlot").disabled = false;
    routesList.dataset.prevValue = routesList.value;
}


// Отменяет выделение цветом предыдущего выбранного пути
function repaintRoute() {
    let route = document.getElementById("routesList").dataset.prevValue.split('_');

    for (let i = 1; i < route.length; i += 2) {
        let prevPipe = app.pipes.get(Number(route[i]));
        prevPipe.setStyle({
            color: '#3388ff'
        });
    }
}


// Строит пьезометрический график
function piezoPlot() {
    // Создание отдельного окна для графика
    let url = "./plot_piezometric.html";
    let params = "left=500, top=100, height=500, width=950"
    let plotWindow = window.open(url, "window", params);

    plotWindow.addEventListener("load", function() {
        // Данные для отрисовки
        let data = {
            // Подписи к оси Ox
            labels: [],
            datasets: [{
                label: 'Напор, м',
                // Значения по оси Oy
                data: [],
                fill: false,
                borderColor: 'red',
                pointRadius: 5
            }]
        };

        let route = document.getElementById("routesList").value.split('_');

        for (let i = 0 ; i < route.length; i += 2) {
            let info = app.objectsInfo.get(Number(route[i]));
            // Название узла
            data.labels.push(info.name);
            // Величина напора
            data.datasets[0].data.push(parseFloat(info.h));
        }

        let config = {
            type: "line",
            data,
            options: {
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: "Напор, м",
                            color: "black",
                            font: {
                                size: 18
                            }
                        }
                    },
                    x: {
                        ticks: {
                            color: "black",
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        };

        new Chart(
            plotWindow.document.getElementById("canvas"),
            config
        );

    });
}


// Отображает корректно панели выбора узла начала и конца 
// для построения пьезометрического графика
function piezometricSetNode() {
    let routesContainer = document.getElementById("routes");
    if (routesContainer) {
        if (document.getElementById("routesList").dataset.prevValue != "none") {
            repaintRoute();
        }
        routesContainer.remove();
        document.getElementById("piezoPlot").remove();
    }

    let begSelect = document.getElementById("begNode");
    let endSelect = document.getElementById("endNode");

    // Восстановить все option
    for (let option of document.querySelectorAll("#begNode option")) {
        option.hidden = false;
    }
    for (let option of document.querySelectorAll("#endNode option")) {
        option.hidden = false;
    }

    if (begSelect.value != "none") {
        document.querySelector(`#endNode option[value="${begSelect.value}"]`).hidden = true;
    }
    if (endSelect.value != "none") {
        document.querySelector(`#begNode option[value="${endSelect.value}"]`).hidden = true;
    }

    if (begSelect.value != "none" && endSelect.value != "none") {
        document.querySelector("#plotPopup button").disabled = false;
    }
    
}

// Закрывает панель упралвения построением пьезометрического графика
function closePlotPopup() {
    let routesContainer = document.getElementById("routes");
    let routesList = document.getElementById("routesList");
    if (routesContainer && routesList.dataset.prevValue != "none") {
        repaintRoute();
    }

    document.getElementById("plotPopup").remove();
}


// ----------------------------------- Управление загрузкой/выгрузкой схем ------------------------------------------


// Показ всплывающего окна для получения названия сохраняемой схемы
function saveNetwork() {
    let popup = document.createElement("div");
    popup.setAttribute("id", "savePopup");

    let p = document.createElement("p");
    p.innerText = "Название схемы";

    let input = document.createElement("input");
    
    let buttonSave = document.createElement("button");
    buttonSave.innerText = "Сохранить";
    buttonSave.onclick = confirmSave;

    let buttonСancel = document.createElement("button");
    buttonСancel.innerText = "Отменить";
    buttonСancel.onclick = cancelSave;

    let buttonsСontainer = document.createElement("div");
    buttonsСontainer.append(buttonSave, buttonСancel);
    popup.append(p, input, buttonsСontainer);

    // Запрос у пользователя названия схемы
    document.getElementById("blackout").before(popup);
    document.getElementById("blackout").style.display = "block";
}


// Сохранение схемы на сервере
function confirmSave() {
    let schemaName = document.querySelector("#savePopup input").value;
    if (schemaName != "") {
        // Подготовка данных для отправки
        schema = {
            "global": {},
            "objects": {
                "nodes": [],
                "pipes": [],
                "params": []
            }
        }

        // Текущие значения глобальных переменных 
        schema["global"].name = schemaName;
        schema["global"].mode = app.mode;
        schema["global"].id = app.id;
        schema["global"].center = app.map.getCenter();

        // Данные об объектах схемы (id, тип, координаты центра)
        for (let obj of app.geoObjects) {
            schema["objects"]["nodes"].push({
                "id": obj.id,
                "type": obj.type,
                "point": obj.value.getLatLng()
            });
        }

        // Данные об участках схемы (id, список коориднат узлов)
        for (let [key, value] of app.pipes.entries()) {
            schema["objects"]["pipes"].push({
                "id": key,
                "points": value.getLatLngs()
            });
        }

        // Данные об гидравлических характеристиках объектов сети
        for (let [key, value] of app.objectsInfo) {
            // (value и так содержит все свйоства, кроме id объекта, поэтому просто создаем копию value и дополняем id)
            schema["objects"]["params"].push(Object.assign({"id": key}, value));
        }

        // Отправка данных на сервер для последующего сохранения
        fetch("/save_schema", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(schema)
        })
        .then(response => response.json())
        .then(function (data) {
            // Уведомление пользователя об успешном сохранении схемы
            if (data.status == 0) {
                alert("Схема сохранена успешно");
                cancelSave();
            }
        })
        .catch(err => console.error(err));
    }
}


// Закрывает всплывающее окно сохранения
function cancelSave() {
    document.getElementById("savePopup").remove();
    document.getElementById("blackout").style.display = "none";
}


// Получение списка сохраненных схем с сервера
function getNetworkList() {
    fetch("/list_schema")
    .then(response => response.json())
    .then(function (data) {

        let popup = document.createElement("div");
        popup.setAttribute("id", "schemaList");

        let title = document.createElement("p");
        title.innerText = "Список схем";

        let list = document.createElement("select");
        list.setAttribute("multiple", "1");
        list.onchange = selection;

        for (let schema of data.list) {
            let option = document.createElement("option");
            option.setAttribute("value", schema);
            option.innerText = schema;

            list.append(option);
        }

        let msg = document.createElement("span");
        msg.innerText = "Схема для загрузки: не выбрана";

        let button_load = document.createElement("button");
        button_load.setAttribute("disabled", "1");
        button_load.innerText = "Загрузить";
        button_load.onclick = loadNetwork;

        let button_cancel = document.createElement("button");
        button_cancel.innerText = "Отменить";
        button_cancel.onclick = loadCancel;

        let button_container = document.createElement("div");
        button_container.append(button_load, button_cancel);
        popup.append(title, list, msg, button_container);

        document.getElementById("blackout").before(popup);
        document.getElementById("blackout").style.display = "block";
    })
    .catch(err => console.error(err));
}


// Загрузка запрошенной схемы с сервера и ее развертывание
function loadNetwork() {
    let url = new URL(window.location.origin + "/load_schema");
    
    // Получаем название выбранной схемы
    let schema = document.querySelector("#schemaList select").value;

    url.searchParams.append("schema", schema);
    
    fetch(url)
    .then(response => response.json())
    .then(function (body) {
        let data = JSON.parse(body.data);

        // Развертывание схемы (глобальная информация)
        app.id = data["global"].id;
        app.map.setView(data["global"].center, zoom=14);

        // Развертывание схемы (геообъекты)
        for (let obj of data["objects"]["nodes"]) {
            initObject(type=obj.type, coordinates=obj.point, key=obj.id);
        }

        // Развертывание схемы (участки)
        for (let obj of data["objects"]["pipes"]) {
            let new_pipe = L.polyline(obj.points, {});
            new_pipe.bindPopup(
                L.popup({
                    closeButton: true
                }).setContent(createCtxMenu("pipe", obj.id))
            );
            new_pipe.addTo(app.map);

            // Добавление стрелок
            var decorator = L.polylineDecorator(new_pipe, {
                patterns: [{
                    offset: 10,   
                    endOffset: 10,
                    repeat: 40,
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 15,
                        headAngle: 35,
                        pathOptions: {
                            fillOpacity: 1,
                            weight: 0
                        }
                    })
                }]
            }).addTo(app.map);

            app.pipes.set(obj.id, new_pipe);
            app.objectsInfo.set(obj.id, new ParamInfo(false));
            app.pipesArrows.set(obj.id, decorator);
        }

        // Развертывание схемы (информация об элементах сети)
        for (let info of data["objects"]["params"]) {
            let obj_id = info.id;
            delete info.id;

            let obj_params = app.objectsInfo.get(obj_id);

            for (let [key, value] of Object.entries(info)) {
                obj_params[key] = value;
            }
        }

        alert("Схема загружена успешно");
        loadCancel();
        createNetwork();
    })
    .catch(err => console.error(err));
}


// Обработка события выбора схемы для загрузки
function selection() {
    let new_val = document.querySelector("#schemaList select").value;
    document.querySelector("#schemaList span").innerText = "Схема для загрузки: " + new_val;
    document.querySelector("#schemaList div button:first-child").disabled = false;
}

// Отмена загрузки схемы
function loadCancel() {
    document.getElementById("schemaList").remove();
    document.getElementById("blackout").style.display = "none";
}


// Придает окну свойство подвижности
function dragElement(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    element.querySelector("p").onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        // Позиция курсора мыши при запуске
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;

        // Вызываемая функция для каждого перемещения
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        // Высчитывание нового положения курсора
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Установка новой позиции элементу
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    // Прекращение движения при отпускании мыши
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}