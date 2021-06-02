//////////////////////////////////////////////////////////////////
// Модуль для управления внешним видом и функционалом кнопок меню
//////////////////////////////////////////////////////////////////


// ------------------------------------------- Управление видом меню ---------------------------------------------


// @water - флаг инициализации инструментов для отрисовки схемы водоснбажения (в случае true)
//          и для отрисовки схемы теплоснабжения (в случае false)
function chooseMode(water) {
    // Установка глобального режима
    app.mode = water ? 'WATER' : 'HEAT';

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


// Выход из какого-либо режима
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
    document.getElementById("addingNodes").style.display = 'none';

    // Скрытие панели расчетов
    document.getElementById("calcPanel").style.display = 'none';

    // Блокировка кнопки сохранения схемы
    document.getElementById('saveNetwork').disabled = true;

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
    app.pipesInfo.clear();
    app.pipesArrows.clear();

    app.polylineEditor = undefined;
    app.editableId = null;
    app.editablePopup = null;
    app.pipePopup = null;

    app.mode = "NONE";
}


// Функция создания новой схемы
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
    let all_buttons = document.querySelectorAll("#addingNodes button");
    for (let button of all_buttons) {
        button.hidden = (!button.classList.contains('heat') && !water) ? true : false;
    }

    // Изменение некоторых иконок на кнопках (зависит от выбранного режима)
    let label = document.querySelector("#buttonAddWell label");
    label.innerText = water ? 'Водопроводный колодец' : 'Тепловая камера';

    let source = document.querySelector('#buttonAddSource');
    source.style.backgroundImage = `url(./images/panel_icons/${app.mode.toLowerCase()}/source.png)`;
    source.style.backgroundPositionY = water ? "3px" : "-1px";

    let chamber = document.querySelector('#buttonAddWell');
    chamber.style.backgroundImage = `url(./images/panel_icons/${app.mode.toLowerCase()}/well.png)`;
    chamber.style.backgroundSize = water ? "25px" : "30px";
    chamber.style.backgroundPositionX = water ? "4px" : "0px";
    chamber.style.backgroundPositionY = water ? "1px" : "0px";

    let consumer = document.querySelector('#buttonAddConsumer');
    consumer.style.backgroundImage = `url(./images/panel_icons/${app.mode.toLowerCase()}/consumer.png)`;
    consumer.style.backgroundSize = water ? "23px" : "20px";
    consumer.style.backgroundPositionX = water ? "4px" : "5px";
    consumer.style.backgroundPositionY = water ? "2px" : "3px";
}


// ------------------------------------------- Управление расчетами ---------------------------------------------


// Выполнение гидравлического расчета
function hydraulic_calc() {
        
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
            'type': obj.type,
            "point": [point['lat'].toString(), point['lng'].toString()]
        });
    }

    // id участков и координаты их начала и конца
    for (let [key, value] of app.pipes.entries()) {
        let points = value.getLatLngs();

        data["pipes"].push({
            "id": key,
            "point_beg": [points[points.length - 1]['lat'].toString(), points[points.length - 1]['lng'].toString()],
            "point_end": [points[0]['lat'].toString(), points[0]['lng'].toString()]
        });
    }

    // Гидравлические характеристики объектов сети
    for (let [key, value] of app.objectsInfo) {
        // (value и так содержит все свйоства, кроме id объекта, поэтому просто создаем копию value и дополняем id)
        data["params"].push(Object.assign({"id": key}, value));
    }

    // Отправка данных на сервер
    fetch('/hydraulic_calc', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(function(body) {
        let new_params = JSON.parse(body.data)['params'];
        
        // Обновление гидравлических характеристик объектов
        for (let i = 0; i < new_params.length; i++) {
            let obj_info = app.objectsInfo.get(new_params[i].id);

            for (let key of Object.keys(obj_info)) {
                obj_info[key] = new_params[i][key];               
            }
        }

        alert('Гидравлические расчеты проведены успешно');
    })
    .catch(err => console.error(err));
}


// ----------------------------------- Управление загрузкой/выгрузкой схем ------------------------------------------


// Показ всплывающего окна для получения названия сохраняемой схемы
function saveNetwork() {
    // <div id="message">
    //     <p>Название схемы</p>
    //     <input type="text">
    //     <div>
    //         <button>Сохранить</button>
    //         <button>Отмена</button>
    //     </div>
    // </div>

    let popup = document.createElement('div');
    popup.setAttribute('id', 'savePopup');

    let p = document.createElement('p');
    p.innerText = 'Название схемы';

    let input = document.createElement('input');
    
    let button_save = document.createElement('button');
    button_save.innerText = 'Сохранить';
    button_save.onclick = confirm_save;

    let button_cancel = document.createElement('button');
    button_cancel.innerText = 'Отменить';
    button_cancel.onclick = cancel_save;

    let button_container = document.createElement('div');
    button_container.append(button_save, button_cancel);
    popup.append(p, input, button_container);

    // Запрос у пользователя названия схемы
    document.getElementById('blackout').before(popup);
    document.getElementById('blackout').style.display = 'block';
}


// Сохранение схемы на сервере
function confirm_save() {
    let schema_name = document.querySelector('#savePopup input').value;
    if (schema_name != "") {
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
        schema['global'].name = schema_name;
        schema['global'].mode = app.mode;
        schema['global'].id = app.id;
        schema['global'].center = app.map.getCenter();

        // Данные об объектах схемы (id, тип, координаты центра)
        for (let obj of app.geoObjects) {
            schema['objects']['nodes'].push({
                "id": obj.id,
                'type': obj.type,
                "point": obj.value.getLatLng()
            });
        }

        // Данные об участках схемы (id, список коориднат узлов)
        for (let [key, value] of app.pipes.entries()) {
            schema['objects']['pipes'].push({
                "id": key,
                "points": value.getLatLngs()
            });
        }

        // Данные об гидравлических характеристиках объектов сети
        for (let [key, value] of app.objectsInfo) {
            // (value и так содержит все свйоства, кроме id объекта, поэтому просто создаем копию value и дополняем id)
            schema['objects']['params'].push(Object.assign({"id": key}, value));
        }

        // Отправка данных на сервер для последующего сохранения
        fetch('/save_schema', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(schema)
        })
        .then(response => response.json())
        .then(function (data) {
            // Уведомление пользователя об успешном сохранении схемы
            if (data.status == 0) {
                alert('Схема сохранена успешно');
                cancel_save();
            }
        })
        .catch(err => console.error(err));
    }
}

// Закрытие высплывающего окна сохранения
function cancel_save() {
    document.getElementById('savePopup').remove();
    document.getElementById('blackout').style.display = 'none';
}


// Получение списка сохраненных схем с сервера
function get_network_list() {
    fetch('/list_schema')
    .then(response => response.json())
    .then(function (data) {

        let popup = document.createElement('div');
        popup.setAttribute('id', 'schemaList');

        let title = document.createElement('p');
        title.innerText = 'Список схем';

        let list = document.createElement('select');
        list.setAttribute('multiple', '1');
        list.onchange = selection;

        for (let schema of data.list) {
            let option = document.createElement('option');
            option.setAttribute('value', schema);
            option.innerText = schema;

            list.append(option);
        }

        let msg = document.createElement('span');
        msg.innerText = 'Схема для загрузки: не выбрана';

        let button_load = document.createElement('button');
        button_load.setAttribute('disabled', '1');
        button_load.innerText = 'Загрузить';
        button_load.onclick = load_network;

        let button_cancel = document.createElement('button');
        button_cancel.innerText = 'Отменить';
        button_cancel.onclick = cancel_load;

        let button_container = document.createElement('div');
        button_container.append(button_load, button_cancel);
        popup.append(title, list, msg, button_container);

        document.getElementById('blackout').before(popup);
        document.getElementById('blackout').style.display = 'block';
    })
    .catch(err => console.error(err));
}


// Загрузка запрошенной схемы с сервера и ее развертывание
function load_network() {
    let url = new URL(window.location.origin + '/load_schema');
    
    // Получаем название выбранной схемы
    let schema = document.querySelector('#schemaList select').value;

    url.searchParams.append('schema', schema);
    
    fetch(url)
    .then(response => response.json())
    .then(function (body) {
        let data = JSON.parse(body.data);

        // Развертывание схемы (глобальная информация)
        app.id = data['global'].id;
        app.map.setView(data['global'].center, zoom=14);

        // Развертывание схемы (геообъекты)
        for (let obj of data['objects']['nodes']) {
            initObject(type=obj.type, coordinates=obj.point, key=obj.id);
        }

        // Развертывание схемы (участки)
        for (let obj of data['objects']['pipes']) {
            let new_pipe = L.polyline(obj.points, {});
            new_pipe.bindPopup(
                L.popup({
                    closeButton: true
                }).setContent(createCtxMenu('pipe', obj.id))
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
        for (let info of data['objects']['params']) {
            let obj_id = info.id;
            delete info.id;

            let obj_params = app.objectsInfo.get(obj_id);

            for (let [key, value] of Object.entries(info)) {
                obj_params[key] = value;
            }
        }

        alert('Схема загружена успешно');
        cancel_load();
        createNetwork();
    })
    .catch(err => console.error(err));
}


// Обработка события выбора схемы для загрузки
function selection() {
    let new_val = document.querySelector("#schemaList select").value;
    document.querySelector("#schemaList span").innerText = 'Схема для загрузки: ' + new_val;
    document.querySelector('#schemaList div button:first-child').disabled = false;
}

// Отмена загрузки схемы
function cancel_load() {
    document.getElementById('schemaList').remove();
    document.getElementById('blackout').style.display = 'none';
}