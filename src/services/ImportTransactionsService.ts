import csvParse from 'csv-parse';
import path from 'path';
import fs from 'fs';

import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';

import CreateTransactionService from './CreateTransactionService';

interface CSVTransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(CSVFileName: string): Promise<Transaction[]> {
    const createTransaction = new CreateTransactionService();

    const csvFilePath = path.join(uploadConfig.directory, CSVFileName);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionsCSV: CSVTransactionDTO[] = [];
    const transactions: Transaction[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cel: string) => cel);

      transactionsCSV.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const transaction of transactionsCSV) {
      // eslint-disable-next-line no-await-in-loop
      const createdTransaction = await createTransaction.execute(transaction);
      transactions.push(createdTransaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
