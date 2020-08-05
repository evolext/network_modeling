// Добавление на карту тепловой камеры \ ответвления \ потребителя
$('#map').on('click', '.initChamber, .initBranch, .initConsumer ', function() {
    map.closePopup();
    // Определение типа добавляемого объекта
    let obj_type = this.className.split(' ').find(elem => elem.startsWith('init')).substr('init'.length).toLowerCase();
    initObject(obj_type, edPopup.getLatLng());
    // Завршить редактирование пайпа
    endPipeEdit();
});

// Возобновление построение пути
$('#map').on('click', '.continuePipe', function() {
    map.closePopup();  
    polylineEditor.continueBackward();
});

// Завершение построения пути
$('#map').on('click', '.endPipe', function() {
    map.closePopup();
    endPipeEdit();
});

// Удаление последней вершины пути
$('#map').on('click', '.removeVertex ', function() {
    map.closePopup();
    let pipe = pipes.get(edId);
    // Массив точек исходного пайпа
    let points = pipe.getLatLngs();
    points.shift();
    pipe.setLatLngs(points);
    pipe.redraw().toggleEdit();
    polylineEditor = pipe.enableEdit();
});

// Удаление редактируемого пути
$('#map').on('click', '.removePipe', function() {
    map.closePopup();
    let pipe = pipes.get(edId);
    pipe.toggleEdit();
    pipe.remove();
    pipes.delete(edId);

    polylineEditor = null;
    edId = null;
    pipePopup = null;
});

// Функция завершения редактирования пайпа
function endPipeEdit() {
    let pipe = pipes.get(edId);
    pipe.disableEdit();
    pipe.bindPopup(pipePopup);

    polylineEditor = null;
    edId = null;
    pipePopup = null;
}

//-------------------------------------------------------------------------------------------------------------------

// Возобновление редактирования пути
$('#map').on('click', '.editPipe', function(e) {
    let new_pipe = pipes.get(Number(e.target.dataset.id));
    new_pipe.closePopup();

    // Завершаем редактирование предыдущего (если какой-то до этого редактировался)
    if (polylineEditor) {
        let old_pipe = pipes.get(edId);
        old_pipe.toggleEdit();
        old_pipe.bindPopup(pipePopup);
    }

    polylineEditor = new_pipe.enableEdit();
    edId = Number(e.target.dataset.id);
    pipePopup = new_pipe.getPopup();
    new_pipe.unbindPopup();
});