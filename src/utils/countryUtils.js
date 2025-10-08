export const formatCountryOptions = (countries) => {
  return countries.map((country) => ({
    value: country.id,
    label: country.name,
    countryName: country.name.toLowerCase(),
    flag_url: country.flag_url,
    phoneCode: country.phone_code,
    searchLabel: country.phone_code && country.name 
      ? `${country.phone_code} (${country.name})` 
      : "",
  }));
};