export class UpdateProductDto {
  name?: string;
  description?: string;
  price?: number | string;
  originalPrice?: number | string;
  category?: string;
  stock?: number | string;
  shop?: string;
  images?: string[];
  isDiscounted?: boolean | string;
  DiscountValue?: number | string;
  
  // Helper fields for image management
  keepExistingImages?: string;
  existingImages?: string[] | string;
}