// @ts-ignore: If you get type errors for axios or form-data, install types with:
// npm install --save-dev @types/axios @types/form-data
// @ts-ignore
import { syncMainValidation } from "main-util-validation";
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import https from 'https';

const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '';
const PINATA_BASE_URL = 'https://api.pinata.cloud';

export class MetadataService {
  static async downloadImageToTemp(url: string): Promise<string> {
    return new Promise((resolve, reject) => {

      const tempPath = path.join(__dirname, '../../uploads/', `temp_${Date.now()}`);
      const file = fs.createWriteStream(tempPath);
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          return reject(new Error('Failed to download image'));
        }
        response.pipe(file);
        file.on('finish', () => file.close(() => resolve(tempPath)));
      }).on('error', (err) => {
        fs.unlink(tempPath, () => reject(err));
      });
    });
  }

  static async uploadImageToPinata(filePath: string, fileName: string, mimeType: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: mimeType
    });
    const { data, status } = await axios.post(
      `${PINATA_BASE_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    if (status !== 200) throw new Error(`Upload failed with status: ${status}`);
    return `https://ipfs.io/ipfs/${data.IpfsHash}`;
  }

  static async uploadMetadataToPinata(metadata: object): Promise<string> {
    const formData = new FormData();
    formData.append('file', Buffer.from(JSON.stringify(metadata)), {
      filename: 'metadata.json',
      contentType: 'application/json'
    });
    const { data, status } = await axios.post(
      `${PINATA_BASE_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    if (status !== 200) throw new Error(`Metadata upload failed with status: ${status}`);
    return `https://ipfs.io/ipfs/${data.IpfsHash}`;
  }

  static async prepareAndUploadMetadata({ name, symbol, description, twitter, telegram, website, imageUrl, file }: {
    name: string,
    symbol: string,
    description?: string,
    twitter?: string,
    telegram?: string,
    website?: string,
    imageUrl?: string,
    file?: any // Accept any type for file to avoid linter error
  }): Promise<{ imageUrl: string, metadataUrl: string }> {
    let tempFilePath: string | null = null;
    let uploadedImageUrl = imageUrl || '';

    try {
      // If no uploaded image but imageUrl is provided, download it
      if (!file && imageUrl) {
        tempFilePath = await this.downloadImageToTemp(imageUrl);
        file = { path: tempFilePath, originalname: path.basename(tempFilePath), mimetype: 'image/png' };
      }

      // Upload image to Pinata if file is present
      if (file) {
        uploadedImageUrl = await this.uploadImageToPinata(file.path, file.originalname, file.mimetype);
      }

      // Create Pump.fun-compatible metadata
      const metadata = {
        name,
        symbol,
        description: description || '',
        image: uploadedImageUrl,
        attributes: [],
        properties: {
          files: uploadedImageUrl ? [
            {
              type: file?.mimetype || 'image/png',
              uri: uploadedImageUrl
            }
          ] : [],
          category: 'image',
          creators: []
        },
        external_url: website || '',
        twitter: twitter || '',
        telegram: telegram || ''
      };

      // Upload metadata JSON to Pinata
      const metadataUrl = await this.uploadMetadataToPinata(metadata);

      // Clean up temp file
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

      return { imageUrl: uploadedImageUrl, metadataUrl };
    } catch (error) {
      console.error('[METADATA PREPARE] Error during metadata preparation:', error);
      if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      throw error;
    }
  }
} 