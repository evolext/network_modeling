//////////////////////////////////////////////////////////////////
// Модуль для управления внешним видом и функционалом кнопок меню
//////////////////////////////////////////////////////////////////


// @cancel - отменять создание или нет
function createNetwork(cancel=false) {
    let buttons_of_create = ["createHeatNetwork", "createWaterNetwork", "cancelCreateNetwork"];
    let panel = document.getElementById("buttonsOfControlSchema");

    // Меняем title на панели
    panel.querySelector("h1").innerText = cancel ? "Схема" : "Создание схемы";

    // Скрываем кнопки управления схемой и отображаем варианты создания
    for (let button of panel.querySelectorAll("button")) {
        button.hidden = buttons_of_create.includes(button.id) ? cancel : !cancel;
    }
}

// @water - флаг инициализации инструментов для отрисовки схемы водоснбажения (в случае true)
//          и для отрисовки схемы теплоснабжения (в случае false)                
function addNodesTools(water) {
    let block = document.getElementById("addingNodes");
    block.hidden = false;
    block.style.display = "flex";
    block.style.flexDirection = "column";
    block.style.alignItems = "center";


    if (!water) {
        app.kind = 'HEAT';

        let invalid_buttons =  document.querySelectorAll("button.water:not(.heat)");
        for (let button of invalid_buttons)
            button.hidden = true;
    
        // Меняем иконки и подписи на некоторых кнопках
        let label = document.querySelector("#buttonAddWell label");
        label.innerText = "Тепловая камера";

        // Также подправляем css-свойства на кнопках панели
        let source = document.querySelector('#buttonAddSource');
        source.style.backgroundImage = "url(./images/panel_icons/heat/source.png)";
        source.style.backgroundPositionY = "-1px";

        let chamber = document.querySelector('#buttonAddWell');
        chamber.style.backgroundImage = "url(./images/panel_icons/heat/well.png)";
        chamber.style.backgroundSize = "30px";
        chamber.style.backgroundPositionX = "0px";
        chamber.style.backgroundPositionY = "0px";

        document.querySelector('#buttonAddBranch').style.backgroundPositionX = "6px";

        let consumer = document.querySelector('#buttonAddConsumer');
        consumer.style.backgroundImage = "url(./images/panel_icons/heat/consumer.png)";
        consumer.style.backgroundSize = "20px";
        consumer.style.backgroundPositionX = "5px";
        consumer.style.backgroundPositionY = "3px";
    }

    // Возвращаем панель в первоначальный вид
    createNetwork(cancel=true);
}