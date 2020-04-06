// Функция удаления источника с карты
$('body').on('click', '.delete_source', function (e) {
   // Удаление с карты
   myMap.geoObjects.remove(sources_array.get($(this).data('source_id')));
   // Удаление из глобального массива объектов
   sources_array.delete($(this).data('source_id'));
   // Удаление информации об объекте
   objects_data.delete($(this).data('source_id'));
});

// Удаление тепловой камеры с карты
$('body').on('click', '.delete_heatchamber', function (e) {
   myMap.geoObjects.remove(heatchambers_array.get($(this).data('heatchamber_id')));
   heatchambers_array.delete($(this).data('heatchamber_id'));
   // Удаление информации об объекте
   objects_data.delete($(this).data('heatchamber_id'));
});

// Функция удаления конечного узла сети с карты
$('body').on('click', '.delete_reciever', function (e) {
   myMap.geoObjects.remove(recievers_array.get($(this).data('reciever_id')));
   recievers_array.delete($(this).data('reciever_id'));
   // Удаление информации об объекте
   objects_data.delete($(this).data('reciever_id'));
});

// Функция удаления ответвления с карты
$('body').on('click', '.delete_branch', function (e) {
   myMap.geoObjects.remove(branches_array.get($(this).data('branch_id')));
   branches_array.delete($(this).data('branch_id'));
   // Удаление информации об объекте
   objects_data.delete($(this).data('branch_id'));
});

// Функция удаления трубы с карты
$('body').on('click', '.delete_pipe', function (e) {
   myMap.geoObjects.remove(pipes_array.get($(this).data('pipe_id')));
   pipes_array.delete($(this).data('pipe_id'));
   // Удаление информации об объекте
   //objects_data.delete($(this).data('branch_id'));
});

// Инициализация трубы от источника
$('body').on('click', '.add_pipe_by_source', function (e) {
   var pipe = new ymaps.Polyline([
      sources_array.get($(this).data('source_id')).geometry._coordinates
   ],
      {
         balloonContent:
            '<button class="show_pipe_info contextButton" data-pipe_id="' + id + '">Информация</button>' +
            '<br>' +
            '<button class="delete_pipe contextButton" id="deletePipe" data-pipe_id="' + id + '">Удалить конечный узел</button>'
      },
      {
         zIndex: 100,
         // Толщина линии
         strokeWidth: 4,
         // Добавляем собственные функции
         editorMenuManager: function (items, event) {
            // Удаление всего пути
            items.push({
               title: "Удалить весь путь",
               onClick: function () {
                  myMap.geoObjects.remove(pipe);
                  // Удаление из глобальной коллекции
                  pipes_array.delete(pipe.key);
               }
            });
            items.push({
               title: "Закончить путь",
               onClick: function () {
                  pipe.editor.stopEditing();
               }
            });
            items.push({
               title: "Ответвление",
               onClick: function () {
                  branch_init(event.geometry._coordinates);
                  pipe_init(event.geometry._coordinates);
                  //event._parent.editor.stopEditing();
               }
            });
            items.push({
               title: "Установить тепловую камеру",
               onClick: function () {
                  // Меняем центр карты
                  myMap.setCenter(event.geometry._coordinates);
                  // Инициализация тепловой камеры
                  heatchamber_init(event.geometry._coordinates);
                  pipe_init(event.geometry._coordinates);
                  event._parent.editor.stopEditing();
               }
            });
            items.push({
               title: "Установить конечный узел",
               onClick: function () {
                  // Меняем центр карты
                  myMap.setCenter(event.geometry._coordinates);
                  // Инициализация тепловой камеры
                  reciever_init(event.geometry._coordinates);
                  event._parent.editor.stopEditing();
               }
            });
            return items;
         }
      }
   );

   // Автоматическое закрытие балуна после нажатия кнопки
   sources_array.get($(this).data('source_id')).balloon.close();
   sources_array.get($(this).data('source_id')).options._options.draggable = false;
   // Структура данных для хранения информации
   var data = [];
   data.push({ value: "0" });
   // Добавление информации в глобальный массив
   objects_data.set(id, data);

   pipe["key"] = id;
   pipes_array.set(id++, pipe);
   myMap.geoObjects.add(pipe);
   pipe.editor.startDrawing();
});

// Инициализация трубы от тепловой камеры
$('body').on('click', '.add_pipe_by_heatchamber', function (e) {
   // Вычисляем центр объекта "прямоугольник"
   var object = heatchambers_array.get($(this).data('heatchamber_id'));

   var x_center = object.geometry._bounds[0][1] + (object.geometry._bounds[1][1] - object.geometry._bounds[0][1]) / 2;
   var y_center = object.geometry._bounds[0][0] + (object.geometry._bounds[1][0] - object.geometry._bounds[0][0]) / 2;

   var pipe = new ymaps.Polyline([
      [y_center, x_center]
   ],
      {
         balloonContent:
            '<button class="show_pipe_info contextButton" data-pipe_id="' + id + '">Информация</button>' +
            '<br>' +
            '<button class="delete_pipe contextButton" id="deletePipe" data-pipe_id="' + id + '">Удалить конечный узел</button>'
      },
      {
         zIndex: 100,
         // Толщина линии
         strokeWidth: 4,
         // Добавляем собственные функции
         editorMenuManager: function (items, event) {
            // Удаление всего пути
            items.push({
               title: "Удалить весь путь",
               onClick: function () {
                  myMap.geoObjects.remove(pipe);
                  // Удаление из глобальной коллекции
                  pipes_array.delete(pipe.key);
               }
            });
            items.push({
               title: "Закончить путь",
               onClick: function () {
                  pipe.editor.stopEditing();
               }
            });
            items.push({
               title: "Ответвление",
               onClick: function () {
                  branch_init(event.geometry._coordinates);
                  pipe_init(event.geometry._coordinates);
                  //event._parent.editor.stopEditing();
               }
            });
            items.push({
               title: "Установить тепловую камеру",
               onClick: function () {
                  // Меняем центр карты
                  myMap.setCenter(event.geometry._coordinates);
                  // Инициализация тепловой камеры
                  heatchamber_init(event.geometry._coordinates);
                  pipe_init(event.geometry._coordinates);
                  event._parent.editor.stopEditing();
               }
            });
            items.push({
               title: "Установить конечный узел",
               onClick: function () {
                  // Меняем центр карты
                  myMap.setCenter(event.geometry._coordinates);
                  // Инициализация тепловой камеры
                  reciever_init(event.geometry._coordinates);
                  event._parent.editor.stopEditing();
               }
            });
            return items;
         }
      }
   );

   // Автоматическое закрытие балуна после нажатия кнопки
   heatchambers_array.get($(this).data('heatchamber_id')).balloon.close();
   // Структура данных для хранения информации
   var data = [];
   data.push({ value: "0" });
   // Добавление информации в глобальный массив
   objects_data.set(id, data);

   pipe["key"] = id;
   pipes_array.set(id++, pipe);
   myMap.geoObjects.add(pipe);
   pipe.editor.startDrawing();
});

// Инициализация трубы от разветвлителя
$('body').on('click', '.add_pipe_by_branch', function (e) {
   var pipe = new ymaps.Polyline([
      branches_array.get($(this).data('branch_id')).geometry._coordinates
   ],
      {
         balloonContent:
            '<button class="show_pipe_info contextButton" data-pipe_id="' + id + '">Информация</button>' +
            '<br>' +
            '<button class="delete_pipe contextButton" id="deletePipe" data-pipe_id="' + id + '">Удалить конечный узел</button>'
      },
      {
         zIndex: 100,
         // Толщина линии
         strokeWidth: 4,
         // Добавляем собственные функции
         editorMenuManager: function (items, event) {
            // Удаление всего пути
            items.push({
               title: "Удалить весь путь",
               onClick: function () {
                  myMap.geoObjects.remove(pipe);
                  // Удаление из глобальной коллекции
                  pipes_array.delete(pipe.key);
               }
            });
            items.push({
               title: "Закончить путь",
               onClick: function () {
                  pipe.editor.stopEditing();
               }
            });
            items.push({
               title: "Ответвление",
               onClick: function () {
                  branch_init(event.geometry._coordinates);
                  pipe_init(event.geometry._coordinates);
                  //event._parent.editor.stopEditing();
               }
            });
            items.push({
               title: "Установить тепловую камеру",
               onClick: function () {
                  // Меняем центр карты
                  myMap.setCenter(event.geometry._coordinates);
                  // Инициализация тепловой камеры
                  heatchamber_init(event.geometry._coordinates);
                  pipe_init(event.geometry._coordinates);
                  event._parent.editor.stopEditing();
               }
            });
            items.push({
               title: "Установить конечный узел",
               onClick: function () {
                  // Меняем центр карты
                  myMap.setCenter(event.geometry._coordinates);
                  // Инициализация тепловой камеры
                  reciever_init(event.geometry._coordinates);
                  event._parent.editor.stopEditing();
               }
            });
            return items;
         }
      }
   );

   // Автоматическое закрытие балуна после нажатия кнопки
   branches_array.get($(this).data('branch_id')).balloon.close();
   // Структура данных для хранения информации
   var data = [];
   data.push({ value: "0" });
   // Добавление информации в глобальный массив
   objects_data.set(id, data);

   pipe["key"] = id;
   pipes_array.set(id++, pipe);
   myMap.geoObjects.add(pipe);
   pipe.editor.startDrawing();
});

// Показ таблицы с информацией об источнике
$('body').on('click', '.show_source_info', function (e) {
   // Закрываем баллун
   sources_array.get($(this).data('source_id')).balloon.close();
   // Настройки вида окна
   var params = 'left=500,top=100,width=400,height=200';
   // Инициализация самого окна с характеристиками
   newWindow = window.open("/popups/source_popup.html", "window", params);
   // Получение информации для заданного объекта из глобального массива
   var info = objects_data.get($(this).data('source_id'));

   // Идентификатор источника
   var id = $(this).data('source_id');

   // Подгрузка контента
   newWindow.onload = function () {
      for (let i = 0; i < info.length; i++)
         newWindow.document.getElementById('value' + (i + 1).toString()).value = info[i].value;
      // Передаем id источника, вызвашего действие
      //newWindow.document.getElementById('idSource').value = id;
   };
   // Обработка перед закрытием страницы
   newWindow.onbeforeunload = function () {
      // Заменяем данные на новые
      for (let i = 0; i < info.length; i++)
         info[i].value = newWindow.document.getElementById('value' + (i + 1).toString()).value;
      // Заменяем в массиве
      objects_data.set(id, info);
   };
});

// Показ таблицы с информацией о конечном узле сети
$('body').on('click', '.show_reciever_info', function (e) {
   // Закрываем баллун
   recievers_array.get($(this).data('reciever_id')).balloon.close();
   // Настройки вида окна
   var params = 'left=500,top=100,width=400,height=200';
   // Инициализация самого окна с характеристиками
   newWindow = window.open("/popups/reciever_popup.html", "window", params);
   // Получение информации для заданного объекта из глобального массива
   var info = objects_data.get($(this).data('reciever_id'));

   // Идентификатор источника
   var id = $(this).data('reciever_id');

   // Подгрузка контента
   newWindow.onload = function () {
      for (let i = 0; i < info.length; i++)
         newWindow.document.getElementById('value' + (i + 1).toString()).value = info[i].value;
   };
   // Обработка перед закрытием страницы
   newWindow.onbeforeunload = function () {
      // Заменяем данные на новые
      for (let i = 0; i < info.length; i++)
         info[i].value = newWindow.document.getElementById('value' + (i + 1).toString()).value;
      // Заменяем в массиве
      objects_data.set(id, info);
   };
});


// Показ таблицы с информацией о тепловой камере
$('body').on('click', '.show_heatchamber_info', function (e) {
   // Закрываем баллун
   heatchambers_array.get($(this).data('heatchamber_id')).balloon.close();
   // Настройки вида окна
   var params = 'left=500,top=100,width=400,height=200';
   // Инициализация самого окна с характеристиками
   newWindow = window.open("/popups/heatchamber_popup.html", "window", params);
   // Получение информации для заданного объекта из глобального массива
   var info = objects_data.get($(this).data('heatchamber_id'));

   // Идентификатор источника
   var id = $(this).data('heatchamber_id');

   // Подгрузка контента
   newWindow.onload = function () {
      for (let i = 0; i < info.length; i++)
         newWindow.document.getElementById('value' + (i + 1).toString()).value = info[i].value;
      // Передаем id источника, вызвашего действие
      //newWindow.document.getElementById('idSource').value = id;
   };
   // Обработка перед закрытием страницы
   newWindow.onbeforeunload = function () {
      // Заменяем данные на новые
      for (let i = 0; i < info.length; i++)
         info[i].value = newWindow.document.getElementById('value' + (i + 1).toString()).value;
      // Заменяем в массиве
      objects_data.set(id, info);
   };
});

// Показ таблицы с информацией об ответвлении
$('body').on('click', '.show_branch_info', function (e) {
   // Закрываем баллун
   branches_array.get($(this).data('branch_id')).balloon.close();
   // Настройки вида окна
   var params = 'left=500,top=100,width=400,height=200';
   // Инициализация самого окна с характеристиками
   newWindow = window.open("/popups/heatchamber_popup.html", "window", params);
   // Получение информации для заданного объекта из глобального массива
   var info = objects_data.get($(this).data('branch_id'));

   // Идентификатор источника
   var id = $(this).data('branch_id');

   // Подгрузка контента
   newWindow.onload = function () {
      for (let i = 0; i < info.length; i++)
         newWindow.document.getElementById('value' + (i + 1).toString()).value = info[i].value;
   };
   // Обработка перед закрытием страницы
   newWindow.onbeforeunload = function () {
      // Заменяем данные на новые
      for (let i = 0; i < info.length; i++)
         info[i].value = newWindow.document.getElementById('value' + (i + 1).toString()).value;
      // Заменяем в массиве
      objects_data.set(id, info);
   };
});

// Показ таблицы с информацией о трубе
$('body').on('click', '.show_pipe_info', function (e) {
   // Закрываем баллун
   pipes_array.get($(this).data('pipe_id')).balloon.close();
   // Настройки вида окна
   var params = 'left=500,top=100,width=400,height=200';
   // Инициализация самого окна с характеристиками
   newWindow = window.open("/popups/pipe_popup.html", "window", params);
   // Получение информации для заданного объекта из глобального массива
   var info = objects_data.get($(this).data('pipe_id'));

   // Идентификатор участка
   var id = $(this).data('pipe_id');

   // Подгрузка контента
   newWindow.onload = function () {
      for (let i = 0; i < info.length; i++)
         newWindow.document.getElementById('value' + (i + 1).toString()).value = info[i].value;
   };
   // Обработка перед закрытием страницы
   newWindow.onbeforeunload = function () {
      // Заменяем данные на новые
      for (let i = 0; i < info.length; i++)
         info[i].value = newWindow.document.getElementById('value' + (i + 1).toString()).value;
      // Заменяем в массиве
      objects_data.set(id, info);
   };
});

// Запрос к серверу: посчитать расход на участках сети
$('#sendValue').on('click', function () {
   $.ajax({
      url: '/zapros',
      type: 'POST',
      data: {
         // Передаваемые данные в заданном формате
         sources: parsing_array(1),
         heatchambers: parsing_array(2),
         recievers: parsing_array(3),
         branches: parsing_array(4),
         pipes: parsing_array(5),
         nodes_costs: parsing_array(6)
      },
      success: function (response) {
         //Записываем в objects_info объектам с индексами участков полученные от сервера данные
         var temp;
         for (let i = 0; i < response.length; i++)
         {
            temp = objects_data.get(parseInt(response[i]['id']));
            temp[0].value = response[i]['value'];
            objects_data.set(parseInt(response[i]['id']), temp);
         }
         alert("Расчеты проведены успешно");
      },
      error: function () {
         alert('Возникла ошибка при выполнении расчетов');
      }
   });
});

// Парсинг словарей объектов, достаем id и координаты геообъекта
function parsing_array(array_type) {
   // Выходной массив объектов типа: { id, координаты }
   var array = [];

   switch (array_type) {
      // Массив источников
      case 1:
         for (let [key, object] of sources_array.entries())
            array.push({ 'id': key, 'coord': object.geometry._coordinates });
         break;
      // Массив тепловых камер
      case 2:
         for (let [key, object] of heatchambers_array.entries())
            array.push({ 'id': key, 'coord': object.geometry._coordinates });
         break;
      // Массив приёмников
      case 3:
         for (let [key, object] of recievers_array.entries())
            array.push({ 'id': key, 'coord': object.geometry._coordinates });
         break;
      // Массив ответвлений
      case 4:
         for (let [key, object] of branches_array.entries())
            array.push({ 'id': key, 'coord': object.geometry._coordinates });
         break;
      // Массив путей
      case 5:
         for (let [key, object] of pipes_array.entries()) {
            let pipe = [];
            for (let i = 0; i < object.geometry._childPath._children.length; i++)
               pipe.push(object.geometry._childPath._children[i]._coordinates);
            array.push({ 'id': key, 'coord': pipe });
         }
         break;
      // Данные о расходах на узлах
      case 6:
         // Сначала находим индексы узлов
         var indices = [];
         for (let [key, object] of sources_array.entries())
            indices.push(key);
         for (let [key, object] of heatchambers_array.entries())
            indices.push(key);
         for (let [key, object] of branches_array.entries())
            indices.push(key);
         for (let [key, object] of  recievers_array.entries())
            indices.push(key);
         // Теперь выписываем значения при узлах
         var temp;
         for (let i = 0; i < indices.length; i++) {
            temp = objects_data.get(indices[i]);
            array.push({'id': indices[i], 'value': temp[0]});
         }
      default:
         break;
   }
   return array;
}

// Отобразить названия у источников
function showHideObjectNames()
{
   // Меняем режим на карте
   MODES.showObjectNames = !MODES.showObjectNames;

   // Перебор всех источников на карте
   for (let object of sources_array.values())
   {
      // Меняем содержимое надписи с названием объекта на пустое
      // Или пустое на название объекта, зависит от режима
      MODES.showObjectNames ? object.properties._data.iconContent = object.name : object.properties._data.iconContent = '';
   }

   // Меняем сообщение на кнопке на панели
   MODES.showObjectNames ? $('#showHideObjectNames').val('Скрыть названия объектов') : $('#showHideObjectNames').val('Отобразить названия объектов');

   // "Обновление" карты, чтобы изменения отобразились
   myMap.setCenter(myMap.getCenter());
}