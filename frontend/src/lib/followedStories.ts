const KEY = "outside_followed_stories";

function read(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(ids: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable — follow state just won't persist
  }
}

export function isFollowed(storyId: number): boolean {
  return read().includes(storyId);
}

export function toggleFollow(storyId: number): boolean {
  const ids = read();
  const idx = ids.indexOf(storyId);
  if (idx === -1) {
    ids.push(storyId);
    write(ids);
    return true;
  }
  ids.splice(idx, 1);
  write(ids);
  return false;
}
