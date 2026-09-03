// Variável privada de módulo (inacessível através de scripts maliciosos injetados via console ou window)
let tempSecureLoginToken = null;

export const setSecureLoginToken = (token) => {
  tempSecureLoginToken = token;
};

export const getSecureLoginToken = () => {
  return tempSecureLoginToken;
};

export const clearSecureLoginToken = () => {
  tempSecureLoginToken = null;
};
