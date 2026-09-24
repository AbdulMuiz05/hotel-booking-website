export const getUserData = async (req, res) => {
  try {
    const { role, recentSearchedCities, username, email, image } = req.user;
    res.json({ success: true, role, recentSearchedCities, username, email, image });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const value = String(username || "").trim();
    if (value.length < 2 || value.length > 80) return res.status(400).json({ success: false, message: "Username must be 2-80 characters" });
    req.user.username = value;
    await req.user.save();
    res.json({ success: true, message: "Profile updated successfully", user: req.user });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const storeRecentSearchedCities = async (req, res) => {
  try {
    const city = String(req.body.recentSearchedCity || "").trim();
    if (!city) return res.status(400).json({ success: false, message: "City is required" });
    req.user.recentSearchedCities = [city, ...req.user.recentSearchedCities.filter(x => x.toLowerCase() !== city.toLowerCase())].slice(0, 3);
    await req.user.save();
    res.json({ success: true, message: "City added", recentSearchedCities: req.user.recentSearchedCities });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
