async function getStudiesForPatientByMRN(dataSource, qidoForStudyUID) {
  if (!qidoForStudyUID?.length) {
    return [];
  }

  const mrn = qidoForStudyUID[0].mrn;

  // if not defined or empty, return the original qidoForStudyUID
  if (!mrn) {
    return qidoForStudyUID;
  }

  const studiesForPatient = await dataSource.query.studies.search({
    patientId: mrn,
    disableWildcard: true,
  });

  // Backend may not support patient-level queries; fall back to the current study
  // so the browser isn't left empty.
  if (!studiesForPatient?.length) {
    return qidoForStudyUID;
  }

  return studiesForPatient;
}

export default getStudiesForPatientByMRN;
