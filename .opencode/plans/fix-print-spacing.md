# Fix print spacing in billing receipt

## File: `app/billing/page.tsx`

### 1. CSS in `handlePrint` (lines ~464-499)

Replace the entire `<style>...</style>` block with:

```css
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: auto; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    font-weight: 400;
    background: #fff;
    width: 100mm;
    padding: 2mm;
    margin: 0 auto;
    line-height: 1.15;
    overflow-wrap: break-word;
  }
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .w-full { width: 100%; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  .font-black { font-weight: 900; }
  .uppercase { text-transform: uppercase; }
  .italic { font-style: italic; }
  .mt-1 { margin-top: 2px; }
  .my-1 { margin-top: 3px; margin-bottom: 3px; }
  .my-2 { margin-top: 3px; margin-bottom: 3px; }
  .pl-2 { padding-left: 4px; }
  .border-t { border-top: 1px solid #000; }
  .border-b { border-bottom: 1px solid #000; }
  .border-dashed { border-style: dashed; }
  .table { display: table; width: 100%; }
  .table-row { display: table-row; }
  .table-cell { display: table-cell; padding: 0; word-break: break-word; }
  @media print {
    @page { size: 80mm 300mm; margin: 0mm; }
    body { margin: 0; padding: 2mm; }
  }
</style>
```

### 2. Reduce font sizes in receipt (off-screen div)

| Search for... | Replace value | Old | New |
|---|---|---|---|
| `<h2 className="font-bold uppercase" style={{ fontSize: '15px' }}>` | `'14px'` | 15px | 14px |
| `<div className="flex justify-between pl-2 italic font-bold" style={{ fontSize: '14px' }}>` | `'12px'` | 14px | 12px |
| `<span className="italic font-bold" style={{ fontSize: '14px' }}>` | `'12px'` | 14px | 12px |
| `<div className="flex justify-between font-black" style={{ fontSize: '22px' }}>` | `'18px'` | 22px | 18px |
| `<p className="text-center italic font-black" style={{ fontSize: '16px' }}>` | `'14px'` | 16px | 14px |
| `<p className="text-center mt-1 font-bold" style={{ fontSize: '12px' }}>` | `'10px'` | 12px | 10px |

### 3. Remove `.py-1` class usage (no longer in CSS)

Search for `className="table-cell py-1"` → replace with `className="table-cell"`
