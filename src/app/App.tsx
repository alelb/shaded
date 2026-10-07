import { Layout } from './Layout.tsx';

// App shell: layout and registration of views. Views live in `features/`; the shell only wires them up.
export function App() {
  return (
    <Layout>
      <p>Data views are being prepared.</p>
    </Layout>
  );
}
