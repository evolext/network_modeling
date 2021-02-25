//////////////////////////////////////////////////////////////////
// Модуль для управления внешним видом и функционалом кнопок меню
//////////////////////////////////////////////////////////////////


// @cancel - отменять создание или нет
function createNetwork(cancel=false) {
    let buttons_of_create = ["createHeatNetwork", "createWaterNetwork", "cancelCreateNetwork"];
    let panel = document.getElementById("buttonsOfControlSchema");

    // Меняем title на панели
    panel.querySelector("caption").innerText = cancel ? "Схема" : "Создание схемы";

    // Скрываем кнопки управления схемой и отображаем варианты создания
    for (let button of panel.querySelectorAll("button")) {
        button.hidden = buttons_of_create.includes(button.id) ? cancel : !cancel;
    }
}

// @water - флаг инициализации инструментов для отрисовки схемы водоснбажения (в случае true)
//          и для отрисовки схемы теплоснабжения (в случае false)                
function addNodesTools(water) {
    document.getElementById("addingNodes").hidden = false;

    if (!water) {
        let invalid_buttons =  document.querySelectorAll("button.water:not(.heat)");
        for (let button of invalid_buttons)
            button.parentElement.parentElement.hidden = true;
    
        let x = 0;
    }


    // Возвращаем панель в первоначальный вид
    createNetwork(cancel=true);
}