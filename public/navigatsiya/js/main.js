// hide/show retailers dropdown
let servicesItem = document.querySelectorAll('.watch-sections');
let servicesItemTitle = document.querySelectorAll('.show-hide-btn');

function removeActiveClassExcept(removeEl) {
  servicesItem.forEach((el) => {
    if (el !== removeEl) {
      el.classList.remove('active');
    }
  });
}

servicesItemTitle.forEach(element => {
  let elementParent = element.parentNode;
  let grandParent = elementParent.parentNode; // Элемент на уровень выше родителя

  element.addEventListener('click', () => {
    if (grandParent.classList.contains('active')) {
      grandParent.classList.remove('active');
    } else {
      // Если кликнутый элемент не активен, удаляем класс 'active' у всех элементов и добавляем его к текущему
      removeActiveClassExcept(grandParent);
      grandParent.classList.add('active');
    }
  });
});


// 
let howItWorkBtn = document.querySelector('.how-to-use__btn');
let howItWorkPopup = document.querySelector('.how-it-work-popup');
let closeFormBtns = document.querySelectorAll('.close-form__btn, .close-window__btn'); // Все кнопки закрытия
let popupWrapper = document.querySelector('.how-it-work-popup__wrapper');

// Открытие попапа
howItWorkBtn.addEventListener('click', () => {
    howItWorkPopup.classList.add('active');
    document.body.classList.add('fixed')
});

// Закрытие попапа при клике на кнопки закрытия
closeFormBtns.forEach(button => {
    button.addEventListener('click', () => {
        document.body.classList.remove('fixed')
        howItWorkPopup.classList.remove('active');
    });
});

// Закрытие попапа при клике вне блока
document.addEventListener('click', (event) => {
    // Проверяем, был ли клик вне попапа
    if (!popupWrapper.contains(event.target) && !howItWorkBtn.contains(event.target)) {
        howItWorkPopup.classList.remove('active');
        document.body.classList.remove('fixed')
    }
});
