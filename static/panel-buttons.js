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

function createWaterNetwork() {
    document.getElementById("addingNodes").hidden = false;
    // Возвращаем панель в первоначальный вид
    createNetwork(cancel=true);
}


function createHeatNetwork() {
}