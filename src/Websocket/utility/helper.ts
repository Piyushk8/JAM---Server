const safe = fn => async (...args) => {
  try {
    await fn(...args);
  } catch (err) {
    args[0]?.log?.error(err, 'Socket handler failed');
  }
};
