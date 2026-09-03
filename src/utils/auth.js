export const saveAuthData = (user, token) => {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", token);
};

export const getStoredUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAdmin = () => {
  const user = getStoredUser();
  return user?.role === "ADMIN";
};

export const logout = () => {
  localStorage.clear();
  window.router.navigate("login");
};

window.auth = { logout };
