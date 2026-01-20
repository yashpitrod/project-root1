useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (!firebaseUser) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const token = await firebaseUser.getIdToken(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error();
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  });

  return unsubscribe;
}, []);
