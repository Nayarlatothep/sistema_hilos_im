import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { styled } from '../../lib/stitches.config';
import { useStore } from '../../store/useStore';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

const UploadSection = styled('section', {
  marginBottom: '$10',
});

const SectionHeader = styled('div', {
  marginBottom: '$6',
  h1: {
    fontSize: '$2xl',
    fontWeight: '700',
    color: '$primary',
  },
  p: {
    color: '$gray500',
  }
});

const DropZoneContainer = styled('div', {
  position: 'relative',
  border: '2px dashed $gray200',
  borderRadius: '$xl',
  backgroundColor: 'white',
  padding: '$12',
  textAlign: 'center',
  transition: 'all 0.2s',
  '&:hover': {
    borderColor: '$accent',
  },
  variants: {
    active: {
      true: {
        borderColor: '$accent',
        backgroundColor: 'rgba(243, 112, 33, 0.05)',
      }
    }
  }
});

const IconWrapper = styled('div', {
  marginBottom: '$4',
  padding: '$4',
  borderRadius: '$round',
  backgroundColor: '$blue50',
  color: '$primary',
  transition: 'all 0.2s',
  display: 'inline-flex',
  [`${DropZoneContainer}:hover &`]: {
    backgroundColor: '$orange50',
    color: '$accent',
  }
});

const Title = styled('h2', {
  fontSize: '$xl',
  fontWeight: '600',
  color: '$primary',
  marginBottom: '$2',
});

const SubTitle = styled('p', {
  color: '$gray500',
  marginBottom: '$6',
});

const BrowseButton = styled('label', {
  cursor: 'pointer',
  backgroundColor: '$primary',
  color: 'white',
  padding: '$2 $6',
  borderRadius: '$2',
  fontWeight: '500',
  boxShadow: '$md',
  transition: 'all 0.2s',
  display: 'inline-block',
  '&:hover': {
     opacity: 0.9,
  }
});

const HiddenInput = styled('input', {
  display: 'none',
});

const StatusContainer = styled('div', {
  marginTop: '$4',
  display: 'flex',
  flexDirection: 'column',
  gap: '$3',
});

const SuccessAlert = styled('div', {
  display: 'flex',
  alignItems: 'center',
  padding: '$4',
  backgroundColor: '$green50',
  borderLeft: '4px solid $green500',
  borderRadius: '0 $2 $2 0',
  color: '$green800',
  fontSize: '$sm',
  fontWeight: '500',
});

const ErrorAlert = styled('div', {
  display: 'flex',
  alignItems: 'center',
  padding: '$4',
  backgroundColor: '$red50',
  borderLeft: '4px solid $red600',
  borderRadius: '0 $2 $2 0',
  color: '$red700',
  fontSize: '$sm',
  fontWeight: '500',
});

// PREVIEW TABLE COMPONENTS
const PreviewSection = styled('section', {
  backgroundColor: 'white',
  borderRadius: '$xl',
  boxShadow: '$sm',
  border: '1px solid $gray200',
  overflow: 'hidden',
  marginBottom: '$10',
});

const PreviewHeader = styled('div', {
  padding: '$4 $6',
  borderBottom: '1px solid $gray100',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '$gray50',
  h3: {
    fontWeight: '700',
    color: '$primary',
  }
});

const ActionRow = styled('div', {
  display: 'flex',
  gap: '$2',
});

const ClearButton = styled('button', {
   fontSize: '$sm',
   color: '$accent',
   fontWeight: '500',
   background: 'none',
   border: 'none',
   cursor: 'pointer',
   '&:hover': { textDecoration: 'underline' }
});

const ProcessButton = styled('button', {
   backgroundColor: '$primary',
   color: 'white',
   fontSize: '$sm',
   padding: '$1 $4',
   borderRadius: '$1',
   border: 'none',
   cursor: 'pointer',
   transition: 'opacity 0.2s',
   '&:hover': { opacity: 0.9 },
   '&:disabled': { opacity: 0.5, cursor: 'not-allowed' }
});

const TableScroll = styled('div', {
  overflowX: 'auto',
  '&::-webkit-scrollbar': { width: '6px', height: '6px' },
  '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
  '&::-webkit-scrollbar-thumb': { background: '#0f2643', borderRadius: '10px' },
});

const Table = styled('table', {
  minWidth: '100%',
  borderCollapse: 'collapse',
});

const Th = styled('th', {
  padding: '$3 $6',
  textAlign: 'left',
  fontSize: '$xs',
  fontWeight: '600',
  color: '$gray500',
  textTransform: 'uppercase',
  tracking: 'wider',
  backgroundColor: '$gray50',
});

const Td = styled('td', {
  padding: '$4 $6',
  whiteSpace: 'nowrap',
  fontSize: '$sm',
  borderBottom: '1px solid $gray100',
});

const Tr = styled('tr', {
  backgroundColor: 'white',
  transition: 'background-color 0.2s',
  '&:hover': { backgroundColor: '$blue50' },
  variants: {
    error: {
      true: {
        backgroundColor: '$red50',
        '&:hover': { backgroundColor: '$red100' }
      }
    }
  }
});

const TableFooter = styled('div', {
  padding: '$3 $6',
  backgroundColor: 'white',
  borderTop: '1px solid $gray100',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const FooterText = styled('p', {
  fontSize: '$xs',
  color: '$gray500',
});

const PaginationControls = styled('div', {
  display: 'flex',
  gap: '$2',
});

const PageButton = styled('button', {
  padding: '$1 $3',
  border: '1px solid $border',
  borderRadius: '$1',
  fontSize: '$sm',
  background: 'white',
  cursor: 'pointer',
  '&:hover': { background: '$gray50' },
  '&:disabled': { opacity: 0.5, cursor: 'not-allowed' }
});

export default function DataIngestion() {
  const [dataToUpload, setDataToUpload] = useState([]);
  const [errorRows, setErrorRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const { uploadPlanificacion, loading } = useStore();

  const onDrop = useCallback((acceptedFiles) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setDataToUpload([]);
    setErrorRows([]);
    
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const validData = [];
        const invalidData = [];

        json.forEach((row, index) => {
          const parsedRow = {
            sku: row.SKU || row.sku || `SKU-${index}`,
            producto: row.Producto || row.producto,
            nombre_color: row.Color || row.nombre_color,
            cantidad: parseInt(row.Cantidad || row.cantidad, 10),
            modulos: row.Modulos || row.Módulos || row.modulos || row.Modulo || row.modulo,
          };

          if (parsedRow.producto && parsedRow.nombre_color && !isNaN(parsedRow.cantidad)) {
            validData.push(parsedRow);
          } else {
            invalidData.push(parsedRow);
          }
        });

        if (validData.length === 0) {
          setErrorMsg('No se encontraron registros válidos en el archivo.');
        } else {
          setDataToUpload(validData);
          setSuccessMsg(`Validation successful. ${validData.length} records found.`);
        }
        
        setErrorRows(invalidData);
      } catch (err) {
        setErrorMsg('Error leyendo el archivo Excel.');
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleProcessAll = async () => {
    if (dataToUpload.length === 0) return;
    const res = await uploadPlanificacion(dataToUpload);
    if (res) {
      setDataToUpload([]);
      setErrorRows([]);
      setSuccessMsg('Registros procesados y guardados exitosamente.');
      setErrorMsg(null);
    } else {
      setErrorMsg('Error al procesar y guardar en base de datos.');
      setSuccessMsg(null);
    }
  };

  const handleClear = () => {
    setDataToUpload([]);
    setErrorRows([]);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const totalRecords = dataToUpload.length + errorRows.length;

  return (
    <>
      <UploadSection>
        <SectionHeader>
          <h1>Import Inventory Data</h1>
          <p>Please upload your weekly inventory files to sync with the central database.</p>
        </SectionHeader>

        <DropZoneContainer {...getRootProps()} active={isDragActive}>
          <IconWrapper>
            <UploadCloud size={48} strokeWidth={1.5} />
          </IconWrapper>
          <Title>Drag & Drop Files</Title>
          <SubTitle>Supported formats: .xlsx, .xls, .csv</SubTitle>
          <BrowseButton>
            Browse Files
            <HiddenInput {...getInputProps()} />
          </BrowseButton>
        </DropZoneContainer>

        <StatusContainer>
          {successMsg && (
            <SuccessAlert>
               <CheckCircle size={20} style={{ marginRight: '12px' }} />
               {successMsg}
            </SuccessAlert>
          )}
          {errorMsg && (
            <ErrorAlert>
               <AlertCircle size={20} style={{ marginRight: '12px' }} />
               {errorMsg}
            </ErrorAlert>
          )}
        </StatusContainer>
      </UploadSection>

      {(dataToUpload.length > 0 || errorRows.length > 0) && (
        <PreviewSection>
          <PreviewHeader>
            <h3>Data Preview</h3>
            <ActionRow>
              <ClearButton onClick={handleClear}>Clear Data</ClearButton>
              <ProcessButton onClick={handleProcessAll} disabled={loading || dataToUpload.length === 0}>
                {loading ? 'Processing...' : 'Process All Records'}
              </ProcessButton>
            </ActionRow>
          </PreviewHeader>

          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th>SKU</Th>
                  <Th>Producto</Th>
                  <Th>Color / Nombre</Th>
                  <Th>Módulo</Th>
                  <Th css={{ textAlign: 'right', paddingRight: '$12' }}>Cantidad</Th>
                </tr>
              </thead>
              <tbody>
                {dataToUpload.map((row, i) => (
                  <Tr key={`valid-${i}`}>
                    <Td css={{ fontWeight: '500', color: '$primary' }}>{row.sku}</Td>
                    <Td css={{ color: '$gray500' }}>{row.producto}</Td>
                    <Td css={{ color: '$gray500' }}>{row.nombre_color}</Td>
                    <Td css={{ color: '$gray500' }}>{row.modulos || 'N/A'}</Td>
                    <Td css={{ fontWeight: '700', color: '$primary', textAlign: 'right', paddingRight: '$12' }}>
                      {row.cantidad}
                    </Td>
                  </Tr>
                ))}
                {errorRows.map((row, i) => (
                  <Tr key={`error-${i}`} error>
                    <Td css={{ fontWeight: '500', color: '$red700' }}>{row.sku || 'ERR'}</Td>
                    <Td css={{ color: '$red600' }}>{row.producto || 'Missing'}</Td>
                    <Td css={{ color: '$red600' }}>{row.nombre_color || 'Missing'}</Td>
                    <Td css={{ color: '$red600' }}>{row.modulos || 'N/A'}</Td>
                    <Td css={{ fontWeight: '700', color: '$red700', textAlign: 'right', paddingRight: '$12' }}>
                      {row.cantidad || 0}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>

          <TableFooter>
            <FooterText>
              Showing {Math.min(1, totalRecords)} to {totalRecords} of {totalRecords} entries
            </FooterText>
            <PaginationControls>
              <PageButton disabled>Previous</PageButton>
              <PageButton disabled={totalRecords <= 10}>Next</PageButton>
            </PaginationControls>
          </TableFooter>
        </PreviewSection>
      )}
    </>
  );
}
