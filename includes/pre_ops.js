// includes/utils.js

function getPartitionOverridePreOps(isIncremental, tableName, partitionCol, backfillStart, defaultStart) {
  //Full refresh
  if (!isIncremental) {
    return `
    DECLARE date_checkpoint DATE DEFAULT DATE('${defaultStart}')
    `;
  }

  //If backfill date provided
  if (backfillStart !== "") {
    return `
    DECLARE date_checkpoint DATE DEFAULT DATE('${backfillStart}');
    DELETE FROM ${tableName} WHERE ${partitionCol} >= DATE('${backfillStart}');
    `;
  }

  //Standard Daily Incremental Run
  return `
    DECLARE date_checkpoint DATE;
    SET date_checkpoint = (
      SELECT COALESCE(MAX(${partitionCol}) + 1, DATE('${defaultStart}')) 
      FROM ${tableName} 
      WHERE is_final = TRUE
    );

    DELETE FROM ${tableName} 
    WHERE ${partitionCol} >= date_checkpoint;
  `;
}

module.exports = { getPartitionOverridePreOps };