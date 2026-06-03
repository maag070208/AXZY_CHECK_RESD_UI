export type CatalogOptionsType = 
    | 'role'
    | 'location'
    | 'guard'
    | 'incident_category'
    | 'incident_type'
    | 'resident_user'
    | 'house';

export interface ICatalogItem {
    id: number | string;
    name: string;
    value: string;
}
