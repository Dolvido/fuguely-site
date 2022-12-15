class Invitation {
  public _id: string;
  public studioId: string;
  public email: string;
  public createdAt: Date;

  constructor(params) {
    Object.assign(this, params);
  }
}

export { Invitation };
