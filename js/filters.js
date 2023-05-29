import { debounce, setInteractiveElementsAvailability } from './util.js';
import { ads, rerenderMarkers } from './map.js';

const DEFAULT_FILTER_VALUE = 'any';

const RERENDER_DELAY = 500;

const filtersForm = document.querySelector('.map__filters');

const currentFilters = {
  type: DEFAULT_FILTER_VALUE,
  price: DEFAULT_FILTER_VALUE,
  rooms: DEFAULT_FILTER_VALUE,
  guests: DEFAULT_FILTER_VALUE,
  features: []
};

const priceRanges = {
  middle: {
    min: 10000,
    max: 50000
  },
  low: {
    max: 10000
  },
  high: {
    min: 50000
  }
};

filtersForm.addEventListener('change', (evt) => {
  if (evt.target.closest('select')) {
    const chosenFilter = evt.target.closest('select').id.replace(/housing-/g, '');
    const filterValue = evt.target.closest('select').value;

    currentFilters[chosenFilter] = filterValue;
  } else if (evt.target.closest('input')) {
    const chosenFilter = evt.target.closest('input');
    if (chosenFilter.checked) {
      currentFilters.features.push(chosenFilter.value);
    } else {
      const index = currentFilters.features.indexOf(chosenFilter.value);
      currentFilters.features.splice(index, 1);
    }
  }
  debounce(() => filterData(), RERENDER_DELAY)();
});

let filteredAds = [];

function filterData() {
  // filter by type
  filteredAds = ads;
  filteredAds = currentFilters.type === DEFAULT_FILTER_VALUE ?
    filteredAds :
    filteredAds.filter((item) => item.offer.type === currentFilters.type);

  // filter by price
  switch (currentFilters.price) {
    case DEFAULT_FILTER_VALUE:
      break;

    case 'middle':
      filteredAds = filteredAds.filter((item) =>
        item.offer.price >= priceRanges.middle.min &&
        item.offer.price < priceRanges.middle.max);
      break;

    case 'low':
      filteredAds = filteredAds.filter((item) => item.offer.price < priceRanges.low.max);
      break;

    case 'high':
      filteredAds = filteredAds.filter((item) => item.offer.price >= priceRanges.high.min);
      break;

    default:
      break;
  }

  // filter by rooms
  filteredAds = currentFilters.rooms === DEFAULT_FILTER_VALUE ?
    filteredAds :
    filteredAds.filter((item) => item.offer.rooms === Number(currentFilters.rooms));

  // filter by guests
  filteredAds = currentFilters.guests === DEFAULT_FILTER_VALUE ?
    filteredAds :
    filteredAds.filter((item) => item.offer.guests === Number(currentFilters.guests));

  // filter by features
  filteredAds = filteredAds.filter((item) =>
    currentFilters.features.every((feature) => {
      if (item.offer.features) {
        return item.offer.features.includes(feature);
      }
      return false;
    }));

  rerenderMarkers(filteredAds);
}

const resetFilters = () => {
  filtersForm.reset();
};

const disableMapFilters = () => {
  filtersForm.classList.add('map__filters--disabled');
  setInteractiveElementsAvailability('select', filtersForm, true);
  setInteractiveElementsAvailability('fieldset', filtersForm, true);
};

disableMapFilters();

const enableMapFilters = () => {
  filtersForm.classList.remove('map__filters--disabled');
  setInteractiveElementsAvailability('select', filtersForm, false);
  setInteractiveElementsAvailability('fieldset', filtersForm, false);
};

export { resetFilters, enableMapFilters };
