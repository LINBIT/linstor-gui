const useIsAdmin = (): boolean => {
  const storedValue = localStorage.getItem('linstorname');
  return storedValue === 'admin';
};

export default useIsAdmin;
