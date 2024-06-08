// auth.service.ts
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import dataSource from '../database/dataSource';
import { UnAuthorizedException } from '../exception/UnAuthorizedException';
import { User } from '../entities/user.entity';
import { verify } from 'jsonwebtoken';
import { CLIENT_ID, CLIENT_SECRET, INVOICE_API_URL, JWT_SECRET } from '../config';
import { UserService } from '../services/user.service';
import axios, { Axios } from 'axios';
import { ClientSecretKey } from '../entities/client-credential.entity';
export class AuthService {
    private userRepository = dataSource.getRepository(User)
    private clientSecretKeyRepository = dataSource.getRepository(ClientSecretKey)
    private axios: Axios = axios.create({ baseURL:  INVOICE_API_URL });
    
    async findMe() {
        return this.clientSecretKeyRepository.findOneBy({ id: undefined })
    }

    async authorize(authToken: string) {
        console.log(authToken)
        const basic = 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')

        const result = await this.axios.post('/auth/authorize/connect', { 
            auth_token: authToken
        }, { headers: {
            Authorization: basic
        }})

        let data = await this.clientSecretKeyRepository.create({
            ...result.data.business_info,
            refresh_token: result.data.refresh_token
        })
        console.log(data)
        data = await this.clientSecretKeyRepository.save(data)
        return { ...data, secret_key: undefined }
    }

    async disconnect() {
        const credential  = await this.clientSecretKeyRepository.findOneBy({ id: undefined })
        return await this.clientSecretKeyRepository.delete({ id: credential?.id })
    }

    async login(email: string, password: string): Promise<string | null> {
        const user = await this.userRepository.findOneBy( { email });

        if (!user) {
            throw new UnAuthorizedException()
        }

        const passwordMatch = await compare(password, user.password);

        if (! passwordMatch) {
            throw new UnAuthorizedException()
        }

        const token = sign({ userId: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '1h', // Token expiration time
        });

        return token;
    }

    async verifyToken(token: string) {
        const decoded = verify(token, JWT_SECRET) as any;
        const userService = new UserService()
        return await userService.findUser(decoded.id);
    }
}

