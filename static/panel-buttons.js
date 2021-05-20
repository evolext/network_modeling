//////////////////////////////////////////////////////////////////
// Модуль для управления внешним видом и функционалом кнопок меню
//////////////////////////////////////////////////////////////////


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
    document.getElementById("saveNetwork").hidden = false;

    // Отображение панели инструментов
    let block = document.getElementById("addingNodes");
    block.hidden = false;
    block.style.display = "flex";
    block.style.flexDirection = "column";
    block.style.alignItems = "center";

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
