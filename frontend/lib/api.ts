const isClient = typeof window !== 'undefined';
const API_URL = isClient ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

export async function createAssignment(formData: FormData) {
  const res = await fetch(`${API_URL}/api/assignments`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create assignment');
  }
  return res.json();
}

export async function getAssignment(id: string) {
  const res = await fetch(`${API_URL}/api/assignments/${id}`);
  if (!res.ok) throw new Error('Assignment not found');
  return res.json();
}

export async function listAssignments() {
  const res = await fetch(`${API_URL}/api/assignments`);
  if (!res.ok) throw new Error('Failed to fetch assignments');
  return res.json();
}

export async function deleteAssignment(id: string) {
  const res = await fetch(`${API_URL}/api/assignments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete assignment');
  return res.json();
}
