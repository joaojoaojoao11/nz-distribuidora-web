/**
 * `text-transform: uppercase` converte o mu ("μ" U+03BC ou "µ" U+00B5) no Mu
 * maiusculo grego, identico a um "M" latino: "190μ" vira "190M". Este helper
 * isola o mu num span sem transform, mantendo a caixa alta do design (mesma
 * solucao do portfolio em PpfPortfolioDocument.tsx).
 */
export default function MuText({ children }: { children: string }) {
  const parts = children.split(/([μµ])/);
  if (parts.length === 1) return <>{children}</>;
  return (
    <>
      {parts.map((part, i) =>
        /^[μµ]$/.test(part) ? (
          <span key={i} style={{ textTransform: 'none' }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
