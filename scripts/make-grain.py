# Tileable paper-fibre overlay: transparent PNG with warm brown specks and fibres. Output: assets/ui/grain.png
import numpy as np
from PIL import Image
N = 512
rng = np.random.default_rng(22)
def blur(a, s):  # wrap-around gaussian blur through FFT, so the tile repeats seamlessly
    f = np.fft.fftfreq(N)[:, None] ** 2 + np.fft.fftfreq(N)[None, :] ** 2
    return np.real(np.fft.ifft2(np.fft.fft2(a) * np.exp(-2 * (np.pi ** 2) * (s ** 2) * f)))
norm = lambda a: (a - a.min()) / (a.max() - a.min())
mott = norm(blur(rng.standard_normal((N, N)), 18))            # soft cloudy blotches
fine = norm(blur(rng.standard_normal((N, N)), 0.7))           # fine tooth
fib = np.zeros((N, N))
for _ in range(1400):                                          # short curved fibres
    x, y, a, L = rng.integers(0, N), rng.integers(0, N), rng.uniform(0, np.pi), rng.integers(6, 22)
    for t in range(L):
        fib[int(y + t * np.sin(a)) % N, int(x + t * np.cos(a)) % N] = 1
        a += rng.normal(0, 0.12)
fib = blur(fib, 0.6)
spk = (rng.random((N, N)) > 0.9988).astype(float)              # rare dark specks
spk = blur(spk, 0.9) * 6
alpha = 0.05 * mott + 0.07 * (fine - 0.5).clip(0) * 2 + 0.22 * norm(fib) ** 2 + spk * 0.35
alpha = (alpha.clip(0, 0.34) * 255).astype(np.uint8)
img = np.zeros((N, N, 4), np.uint8); img[..., 0], img[..., 1], img[..., 2] = 92, 66, 30; img[..., 3] = alpha
Image.fromarray(img, 'RGBA').save('assets/ui/grain.png', optimize=True)
