import { isMapInit, renderMarkers } from './map.js';
import { getData, sendData } from './api.js';
import { showSuccessMessage, showAlert, isEscapeKey } from './util.js';

const MAX_AD_PRICE = 100000;
const MIN_AD_PRICE = {
  bungalow: 0,
  flat: 1000,
  hotel: 3000,
  house: 5000,
  palace: 10000
};
const SLIDER_SETS = {
  min: 0,
  max: 100000,
  step: 1000,
  start: 5000
};
const PLACE_CAPACITY = {
  1: [1],
  2: [1, 2],
  3: [1, 2, 3],
  100: [0]
};

const adForm = document.querySelector('.ad-form');
const mapFilters = document.querySelector('.map__filters');
const titleField = adForm.querySelector('#title');
const priceField = adForm.querySelector('#price');
const typeField = adForm.querySelector('#type');
const timeInField = adForm.querySelector('#timein');
const timeOutField = adForm.querySelector('#timeout');
const sliderElement = adForm.querySelector('#slider');
const roomNumber = adForm.querySelector('#room_number');
const placeCapacity = adForm.querySelector('#capacity');
const submitBtn = adForm.querySelector('.ad-form__submit');
const resetBtn = adForm.querySelector('.ad-form__reset');

const modalCases = ['error', 'success'];

const setInteractiveElementsAvalibility =
  (selector, container = document, state = true) => {
    container.querySelectorAll(selector).forEach((element) => {
      element.disabled = state;
    });
};

const disableForm = () => {
  adForm.classList.add('ad-form--disabled');
  setInteractiveElementsAvalibility('input', adForm, true);
  setInteractiveElementsAvalibility('button', adForm, true);
};

const disableMapFilters = () => {
  mapFilters.classList.add('map__filters--disabled');
  setInteractiveElementsAvalibility('select', mapFilters, true);
  setInteractiveElementsAvalibility('fieldset', mapFilters, true);
};

const enableForm = () => {
  adForm.classList.remove('ad-form--disabled');
  setInteractiveElementsAvalibility('input', adForm, false);
  setInteractiveElementsAvalibility('button', adForm, false);
};

const enableMapFilters = () => {
  mapFilters.classList.remove('map__filters--disabled');
  setInteractiveElementsAvalibility('select', mapFilters, false);
  setInteractiveElementsAvalibility('fieldset', mapFilters, false);
};

disableForm();
disableMapFilters();

if (isMapInit) {
  enableForm();
}

const blockSubmitBtn = () => {
  submitBtn.disabled = true;
};

const unblockSubmitBtn = () => {
  submitBtn.disabled = false;
};

const closeModal = (result) => {
  document.querySelector(`.${result}`).remove();

  document.removeEventListener('keydown', onDocumentKeydown);
};

const showModal = (result) => {
  const modalTemplate = document.querySelector(`#${result}`)
    .content.querySelector(`.${result}`);
  const modalElement = modalTemplate.cloneNode(true);

  document.body.appendChild(modalElement);

  document.querySelector(`.${result}`).addEventListener('click', (evt) => {
    closeModal(result);
  });

  document.addEventListener('keydown', onDocumentKeydown);
};

const clearForm = () => {
  adForm.reset();
  sliderElement.noUiSlider.reset();
};

const onSuccess = () => {
  clearForm();
  showModal('success');
};
const onError = () => showModal('error');

const isModalOpen = (modalName) => {
  const modal = document.querySelector(`.${modalName}`);

  if (modal) {
    return true;
  }
  return false;
};

function onDocumentKeydown(evt) {
  if (isEscapeKey(evt) && !isModalOpen('error')) {
    evt.preventDefault();
  }

  modalCases.forEach((modalCase) => {
    if (isModalOpen(modalCase)) {
      closeModal(modalCase);
    }
  });
}

const pristine = new Pristine(adForm, {
  classTo: 'ad-form__element',
  errorClass: 'ad-form__element--invalid',
  errorTextParent: 'ad-form__element',
  errorTextTag: 'p',
  errorTextClass: 'text-help'
});

pristine.addValidator(titleField, validateAdTitle, 'Заголовок не соответствует правилам');
pristine.addValidator(priceField, validateAdPrice, 'Цена не соответствует правилам');
pristine.addValidator(placeCapacity, validateCapacity, 'Слишком маленькое место для указанного количества гостей');

function validateAdTitle(value) {
  const exp = /[\w\d\s\n\W]{30,100}/i;
  return exp.test(value);
}

function validateAdPrice(value) {
  const exp = /[0-9]/g;
  const minPrice = MIN_AD_PRICE[typeField.value];
  return exp.test(value) && value <= MAX_AD_PRICE && value >= minPrice;
}

function validateCapacity(value) {
  return PLACE_CAPACITY[roomNumber.value].includes(parseInt(value));
}

typeField.addEventListener('change', () => {
  priceField.placeholder = MIN_AD_PRICE[typeField.value];
  pristine.validate(priceField);
});

timeInField.addEventListener('change', (evt) => {
  const timeOutOptions = timeOutField.querySelectorAll('option');
  timeOutOptions.forEach((option) => {
    option.value == evt.target.value ? option.selected = true : option.selected = false;
  });
});

timeOutField.addEventListener('change', (evt) => {
  const timeInOptions = timeInField.querySelectorAll('option');
  timeInOptions.forEach((option) => {
    option.value == evt.target.value ? option.selected = true : option.selected = false;
  });
});

const setAdFormSubmit = () => {
  adForm.addEventListener('submit', (evt) => {
    evt.preventDefault();

    const isValid = pristine.validate();

    if (isValid) {
      blockSubmitBtn();
      sendData(new FormData(evt.target), onSuccess, onError)
        .then(unblockSubmitBtn)
        .finally(enableMapFilters);
      getData(renderMarkers, showSuccessMessage, showAlert);
    }
  });
};

noUiSlider.create(sliderElement, {
  range: {
    min: SLIDER_SETS.min,
    max: SLIDER_SETS.max,
  },
  start: SLIDER_SETS.start,
  step: SLIDER_SETS.step,
  connect: 'lower',
  format: {
    to: function (value) {
      return value.toFixed(0);
    },
    from: function (value) {
      return parseFloat(value).toFixed(2);
    },
  },
});

sliderElement.noUiSlider.on('update', () => {
  priceField.value = sliderElement.noUiSlider.get();
  pristine.validate(priceField);
});

priceField.addEventListener('change', () => {
  sliderElement.noUiSlider.set(priceField.value);
  pristine.validate(priceField);
});

placeCapacity.addEventListener('change', () => {
  pristine.validate(placeCapacity);
});

roomNumber.addEventListener('change', () => {
  pristine.validate(placeCapacity);
});

resetBtn.addEventListener('click', () => {
  clearForm();
});

setAdFormSubmit();
