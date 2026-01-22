import dayjs from 'dayjs';
import type { ApiRecord, Prebooking } from '../types';

/** Normalize new API records to the app's Prebooking shape */
export function normalizeApiRecords(rows: ApiRecord[]): Prebooking[] {
  return rows.map((r, idx) => {
    const firstName = r.associatedPerson?.firstName || '';
    const lastName = r.associatedPerson?.lastName || '';
    const statusMazda6e = r.associatedPerson?.statusMazda6e || '';
    // If your API later adds 'Interior' field, we will use it; otherwise default to 'Black'
    const interior = (r as any).Interior || 'Black';
    const pkg = r.PackageName || 'None';

    return {
      bookingAt: dayjs(r.BookingCreated).toISOString(),
      bookingNo: r.ID?.toString() || String(220000 + idx),
      mazdaId: r.MemberDisplayID || '',
      firstName,
      lastName,
      statusMazda6e,
      dealer: r.Dealer || '',
      exteriorColor: r.Color || '',
      interiorColor: interior,
      package: pkg === 'None' ? 'None' : (pkg || 'None'),
      model: r.Model || '',
      range: r.Grade || '',
      email: '',
      phone: '',
      colorCode: r.ColorCode,
      status: r.Status,
      slip: r.Slip
    };
  });
}
