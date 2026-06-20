const User = require('../models/User');

const PACKAGES = [
  { id: 1, credits: 10, price: 99, label: '10 Credits' },
  { id: 2, credits: 25, price: 199, label: '25 Credits' },
  { id: 3, credits: 50, price: 349, label: '50 Credits' }
];

// Get credit balance
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('credits');
    res.json({ credits: user.credits });
  } catch (err) {
    console.error('Get balance error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get credit packages
exports.getPackages = async (req, res) => {
  res.json(PACKAGES);
};

// Purchase a package (mock)
exports.purchase = async (req, res) => {
  try {
    const { packageId } = req.body;

    const pkg = PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    const user = await User.findByIdAndUpdate(
      req.user,
      { $inc: { credits: pkg.credits } },
      { new: true }
    ).select('credits');

    res.json({
      message: `Purchased ${pkg.label}!`,
      credits: user.credits
    });
  } catch (err) {
    console.error('Purchase error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
